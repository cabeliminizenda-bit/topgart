import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { getSettings } from '@/actions/settings';
import { sendEmail, sendNewsletterWelcomeEmail } from '@/lib/mailer';
import { escapeHtml } from '@/lib/security';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return new NextResponse('Missing token', { status: 400 });
  }

  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [email, expiry, signature] = decoded.split('|');

    if (!email || !expiry || !signature) {
      return new NextResponse('Invalid token', { status: 400 });
    }

    if (Date.now() > parseInt(expiry, 10)) {
      return new NextResponse('Token expired', { status: 400 });
    }

    // Strong secret resolution: use dedicated secret or server-side keys
    const secret = process.env.NEWSLETTER_SECRET || process.env.NEXTAUTH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.CRON_SECRET || process.env.DATABASE_URL || 'fallback-newsletter-key';
    const payload = `${email}|${expiry}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const signatureBuffer = Buffer.from(signature, 'hex');

    if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
      return new NextResponse('Invalid signature', { status: 400 });
    }

    const settings = await getSettings();
    const receiverEmail = settings.CONTACT_RECEIVER_EMAIL || 'info@hlg-hausgeraete.de';
    const storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'HLG Hausgeräte';

    // 1. Persist subscriber in Setting table
    try {
      const existingSubscribersSetting = await prisma.setting.findUnique({
        where: { key: 'NEWSLETTER_SUBSCRIBERS' }
      });
      let subscribers: Array<{ email: string; date: string }> = [];
      if (existingSubscribersSetting?.value) {
        try {
          subscribers = JSON.parse(existingSubscribersSetting.value);
        } catch {}
      }
      if (!subscribers.some(s => s.email.toLowerCase() === email.toLowerCase())) {
        subscribers.push({ email: email.toLowerCase(), date: new Date().toISOString() });
        await prisma.setting.upsert({
          where: { key: 'NEWSLETTER_SUBSCRIBERS' },
          update: { value: JSON.stringify(subscribers) },
          create: { key: 'NEWSLETTER_SUBSCRIBERS', value: JSON.stringify(subscribers) }
        });
      }
    } catch (dbErr) {
      console.error('[NEWSLETTER] Error persisting subscriber:', dbErr);
    }

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
      subject: `📬 [Newsletter] Neue Anmeldung bestätigt: ${escapeHtml(email)}`,
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

    // 4. Send welcome email to client with 25€ voucher
    await sendNewsletterWelcomeEmail(email).catch(console.error);

    // 5. Redirect back to site with success query parameter
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || SITE_URL || 'https://hlghausgeraete.de';
    return NextResponse.redirect(`${baseUrl}/?newsletter=success`);
  } catch (err) {
    console.error('Confirm newsletter error:', err);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
