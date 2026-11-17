'use server';

import prisma from '@/lib/prisma';
import { getContactSettings } from './contactSettings';
import { getTranslations } from 'next-intl/server';
import { escapeHtml } from '@/lib/security';
import crypto from 'crypto';
import { SITE_URL } from '@/lib/site';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function submitContactMessage(formData: FormData) {
  try {
    const ip = await getClientIp();
    const rateLimit = await checkRateLimit(`contact_${ip}`, 5, 600); // 5 messages per 10 minutes per IP
    if (!rateLimit.success) {
      return { error: 'Zu viele Anfragen. Bitte warten Sie einige Minuten, bevor Sie eine weitere Nachricht senden.' };
    }

    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const phone = String(formData.get('phone') || '').trim();
    const subject = String(formData.get('subject') || '').trim();
    const message = String(formData.get('message') || '').trim();

    if (!name || !email || !message) {
      const t = await getTranslations('Contact');
      return { error: t('missing_fields') };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { error: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' };
    }

    // Limit field lengths to prevent abuse
    if (name.length > 200 || email.length > 254 || (subject && subject.length > 500) || message.length > 5000) {
      const t = await getTranslations('Contact');
      return { error: t('fields_too_long') };
    }

    const contactSettings = await getContactSettings();
    const receiverEmail = contactSettings.formRecipient;

    // Send email to the configured admin/receiver
    try {
      const { sendEmail } = await import('@/lib/mailer');
      await sendEmail({
        to: receiverEmail,
        replyTo: email ? (name ? `"${name}" <${email}>` : email) : undefined,
        subject: subject ? `Neue Nachricht: "${escapeHtml(subject)}"` : `Neue Nachricht von ${escapeHtml(name)}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.5; padding: 20px;">
            <h2 style="color: #107b46; margin-top: 0;">Neue Kontaktanfrage über die Website</h2>
            <p><strong>Name:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
            ${phone ? `<p><strong>Telefon:</strong> ${escapeHtml(phone)}</p>` : ''}
            ${subject ? `<p><strong>Betreff:</strong> ${escapeHtml(subject)}</p>` : ''}
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
            <p><strong>Nachricht:</strong><br/><br/>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>
            <br/>
            <p style="color: #64748b; font-size: 13px;"><em>Bitte antworten Sie dem Kunden zeitnah.</em></p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('[CONTACT] Failed to send email:', emailErr);
    }

    return { success: true, message: 'Ihre Nachricht wurde erfolgreich versendet!' };
  } catch (error) {
    console.error('Contact submission error:', error);
    const t = await getTranslations('Contact');
    return { error: t('error_sending') };
  }
}

export async function submitNewsletter(formData: FormData) {
  try {
    const ip = await getClientIp();
    const rateLimit = await checkRateLimit(`newsletter_${ip}`, 5, 3600); // 5 subscriptions per hour per IP
    if (!rateLimit.success) {
      return { error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.' };
    }

    const email = String(formData.get('email') || '').trim().toLowerCase();

    if (!email) {
      return { error: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' };
    }

    // Validation format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 254) {
      return { error: 'Ungültige E-Mail-Adresse.' };
    }

    const secret = process.env.NEWSLETTER_SECRET || process.env.NEXTAUTH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.CRON_SECRET || process.env.DATABASE_URL || 'fallback-newsletter-key';
    const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    const payload = `${email}|${expiry}`;
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const token = Buffer.from(`${payload}|${signature}`).toString('base64');
    const confirmUrl = `${SITE_URL}/api/newsletter/confirm?token=${encodeURIComponent(token)}`;

    try {
      const { sendEmail } = await import('@/lib/mailer');
      
      // 1. Send confirmation opt-in email to subscriber
      await sendEmail({
        to: email,
        subject: `Bitte bestätigen Sie Ihre Newsletter-Anmeldung - HLG Hausgeräte`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; padding: 25px; background: #ffffff;">
            <div style="font-size: 20px; font-weight: bold; color: #107b46; margin-bottom: 20px;">HLG Hausgeräte</div>
            <h1 style="font-size: 22px; color: #0f172a; margin-top: 0; margin-bottom: 15px;">Bitte bestätigen Sie Ihre Anmeldung</h1>
            <p style="font-size: 14px; color: #475569; margin-bottom: 20px;">
              Vielen Dank für Ihr Interesse am Newsletter von <strong>HLG Hausgeräte</strong>! Bitte klicken Sie auf den untenstehenden Button, um Ihre Anmeldung zu bestätigen und Ihren <strong>15 € Gutschein</strong> zu erhalten:
            </p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${confirmUrl}" style="background-color: #107b46; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">Anmeldung bestätigen</a>
            </p>
            <p style="font-size: 12px; color: #94a3b8; margin-top: 25px;">
              Falls Sie diese Anmeldung nicht angefordert haben, können Sie diese E-Mail einfach ignorieren.
            </p>
          </div>
        `,
      });

      // 2. Fetch admin email from settings
      const settingsDb = await prisma.setting.findMany({
        where: { key: { in: ['CONTACT_RECEIVER_EMAIL', 'CONTACT_FORM_RECIPIENT'] } }
      });
      const sMap = settingsDb.reduce((acc, item) => ({ ...acc, [item.key]: item.value }), {} as Record<string, string>);
      const adminEmail = sMap.CONTACT_RECEIVER_EMAIL || sMap.CONTACT_FORM_RECIPIENT || 'cabeliminizenda@gmail.com';

      // 3. Send immediate notification to Admin
      await sendEmail({
        to: adminEmail,
        replyTo: email,
        subject: `[HLG HAUSGERÄTE]: Neue Newsletter-Anmeldung: ${email}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; padding: 25px; background: #ffffff;">
            <div style="font-size: 20px; font-weight: bold; color: #107b46; margin-bottom: 20px;">HLG Hausgeräte</div>
            <h1 style="font-size: 22px; color: #0f172a; margin-top: 0; margin-bottom: 15px;">📬 Neue Newsletter-Anmeldung</h1>
            <p style="font-size: 14px; color: #475569; margin-bottom: 20px;">
              Ein neuer Interessent hat sich soeben für den Newsletter von <strong>HLG Hausgeräte</strong> angemeldet:
            </p>
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 15px; border: 1px solid #e2e8f0; margin-bottom: 25px;">
              <p style="margin: 0; font-size: 14px;"><strong>E-Mail:</strong> <a href="mailto:${escapeHtml(email)}" style="color: #107b46; font-weight: 600; text-decoration: none;">${escapeHtml(email)}</a></p>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: #64748b;"><strong>Datum:</strong> ${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}</p>
            </div>
            <div style="text-align: center; margin-top: 25px;">
              <a href="${SITE_URL}/admin/settings" style="background-color: #107b46; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">
                Abonnenten im Admin-Panel anzeigen
              </a>
            </div>
          </div>
        `,
      });

      // 4. In-app admin notification
      await prisma.notification.create({
        data: {
          isAdmin: true,
          type: 'SYSTEM',
          message: `Neue Newsletter-Anmeldung: ${email}`,
          link: '/admin/settings',
          isRead: false,
        }
      }).catch(e => console.error('[NEWSLETTER] Notification create error:', e));

      // 5. Save to database subscribers setting
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
    } catch (emailErr) {
      console.error('[NEWSLETTER] Failed to process email notifications:', emailErr);
    }

    return { success: true, message: 'Bitte überprüfen Sie Ihren Posteingang, um Ihre Anmeldung zu bestätigen.' };
  } catch (error) {
    console.error('Newsletter submission error:', error);
    return { error: 'Beim Verarbeiten Ihrer Anmeldung ist ein Fehler aufgetreten.' };
  }
}
