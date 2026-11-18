import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { sendEmail, sendNewsletterWelcomeEmail } from '@/lib/mailer';
import { escapeHtml, sanitizeEmailHeader } from '@/lib/security';
import { getNewsletterHmacSecret } from '@/lib/serverSecrets';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token || token.length > 1024) {
    return new NextResponse('Fehlender Bestätigungstoken', { status: 400 });
  }

  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split('|');
    if (parts.length !== 3) {
      return new NextResponse('Ungültiger Bestätigungstoken', { status: 400 });
    }
    const [rawEmail, expiry, signature] = parts;
    const email = rawEmail.trim().toLowerCase();

    if (!email || !expiry || !signature || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new NextResponse('Ungültiger Bestätigungstoken', { status: 400 });
    }

    // SECURITY (M5): Reject non-numeric / NaN expiry values
    const expiryMs = Number(expiry);
    if (!Number.isFinite(expiryMs) || Date.now() > expiryMs) {
      return new NextResponse('Bestätigungslink abgelaufen', { status: 400 });
    }

    if (!/^[0-9a-f]{64}$/i.test(signature)) {
      return new NextResponse('Ungültige Signatur', { status: 400 });
    }

    const secret = getNewsletterHmacSecret();
    const payload = `${email}|${expiry}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const signatureBuffer = Buffer.from(signature, 'hex');

    if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
      return new NextResponse('Ungültige Signatur', { status: 400 });
    }

    const receiverSettings = await prisma.setting.findMany({
      where: { key: { in: ['CONTACT_RECEIVER_EMAIL', 'CONTACT_FORM_RECIPIENT'] } }
    });
    const rMap = receiverSettings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);
    const receiverEmail = rMap.CONTACT_RECEIVER_EMAIL || rMap.CONTACT_FORM_RECIPIENT || process.env.ADMIN_EMAIL || 'kontakt@topgartengeraete.de';
    const storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'Top Gartengeräte';

    // 1. Persist confirmed subscriber in Setting table (idempotent check)
    let isNewSubscriber = true;
    try {
      const existingSubscribersSetting = await prisma.setting.findUnique({
        where: { key: 'NEWSLETTER_SUBSCRIBERS' }
      });
      let subscribers: Array<{ email: string; date: string }> = [];
      if (existingSubscribersSetting?.value) {
        try {
          subscribers = JSON.parse(existingSubscribersSetting.value);
        } catch { }
      }
      if (subscribers.some(s => s.email.toLowerCase() === email)) {
        isNewSubscriber = false;
      } else {
        subscribers.push({ email, date: new Date().toISOString() });
        await prisma.setting.upsert({
          where: { key: 'NEWSLETTER_SUBSCRIBERS' },
          update: { value: JSON.stringify(subscribers) },
          create: { key: 'NEWSLETTER_SUBSCRIBERS', value: JSON.stringify(subscribers) }
        });
      }
    } catch (dbErr) {
      console.error('[NEWSLETTER] Error persisting subscriber:', dbErr);
    }

    // Only trigger notifications and welcome email once per confirmed address
    if (isNewSubscriber) {
      // 2. Create in-app notification for admin
      try {
        await prisma.notification.create({
          data: {
            isAdmin: true,
            type: 'SYSTEM',
            message: `Neue Newsletter-Anmeldung bestätigt: ${email}`,
            link: '/admin/settings',
            isRead: false,
          }
        });
      } catch (notifErr) {
        console.error('[NEWSLETTER] Error creating admin notification:', notifErr);
      }

      // 3. Send notification to admin email in German
      await sendEmail({
        to: receiverEmail,
        subject: sanitizeEmailHeader(`[TOP GARTENGERÄTE]: Newsletter-Anmeldung bestätigt: ${email}`),
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.5; padding: 20px;">
            <h1 style="font-size: 20px; color: #107b46; margin-top: 0; margin-bottom: 15px;">📬 Neue Newsletter-Anmeldung</h1>
            <p style="font-size: 14px; color: #475569;">Ein Kunde hat seine Anmeldung für den Newsletter von <strong>${escapeHtml(storeName)}</strong> erfolgreich bestätigt.</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px; background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <tr>
                <td style="padding: 10px; font-size: 13px; font-weight: bold; width: 120px; color: #64748b;">E-Mail:</td>
                <td style="padding: 10px; font-size: 13px;">
                  <a href="mailto:${escapeHtml(email)}" style="color: #107b46; text-decoration: none; font-weight: 600;">${escapeHtml(email)}</a>
                </td>
              </tr>
              <tr style="border-top: 1px solid #e2e8f0;">
                <td style="padding: 10px; font-size: 13px; font-weight: bold; color: #64748b;">Datum:</td>
                <td style="padding: 10px; font-size: 13px; color: #0f172a;">${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}</td>
              </tr>
            </table>
            
            <div style="border-top: 1px solid #e2e8f0; margin-top: 30px; padding-top: 20px; text-align: center; font-size: 11px; color: #107b46;">
              <strong>${escapeHtml(storeName)}</strong>
            </div>
          </div>
        `,
      }).catch(console.error);

      // 4. Send welcome email to client with voucher
      await sendNewsletterWelcomeEmail(email).catch(console.error);
    }

    // 5. Redirect to the Thank You page
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || SITE_URL || 'https://topgartengeraete.de';
    return NextResponse.redirect(`${baseUrl}/thank-you`);
  } catch (err) {
    console.error('Confirm newsletter error:', err);
    return new NextResponse('Interner Serverfehler', { status: 500 });
  }
}
