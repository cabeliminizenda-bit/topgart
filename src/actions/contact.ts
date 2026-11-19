'use server';

import prisma from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import { escapeHtml, sanitizeEmailHeader } from '@/lib/security';
import { getNewsletterHmacSecret } from '@/lib/serverSecrets';
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

    const receiverRows = await prisma.setting.findMany({
      where: { key: { in: ['CONTACT_FORM_RECIPIENT', 'CONTACT_RECEIVER_EMAIL'] } },
    });
    const rMap = receiverRows.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);
    const receiverEmail = rMap.CONTACT_FORM_RECIPIENT || rMap.CONTACT_RECEIVER_EMAIL || process.env.ADMIN_EMAIL || 'kontakt@topgartengeraete.de';

    // Send email to the configured admin/receiver
    try {
      const { sendEmail } = await import('@/lib/mailer');
      const safeName = sanitizeEmailHeader(name).replace(/"/g, '');
      const safeEmail = sanitizeEmailHeader(email);
      await sendEmail({
        to: receiverEmail,
        replyTo: safeEmail ? (safeName ? `"${safeName}" <${safeEmail}>` : safeEmail) : undefined,
        subject: subject ? `Neue Nachricht: "${sanitizeEmailHeader(subject)}"` : `Neue Nachricht von ${safeName}`,
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
    const rateLimit = await checkRateLimit(`newsletter_${ip}`, 10, 3600); // 10 subscriptions per hour per IP
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

    // 1. Persist confirmed subscriber in Setting table
    try {
      const existingSetting = await prisma.setting.findUnique({
        where: { key: 'NEWSLETTER_SUBSCRIBERS' }
      });
      let subscribers: Array<{ email: string; date: string }> = [];
      if (existingSetting?.value) {
        try {
          subscribers = JSON.parse(existingSetting.value);
        } catch {}
      }
      if (!subscribers.some(s => s.email.toLowerCase() === email)) {
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

    // 2. Fetch admin receiver email
    const receiverRows = await prisma.setting.findMany({
      where: { key: { in: ['CONTACT_FORM_RECIPIENT', 'CONTACT_RECEIVER_EMAIL'] } },
    });
    const rMap = receiverRows.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);
    const adminEmail = rMap.CONTACT_FORM_RECIPIENT || rMap.CONTACT_RECEIVER_EMAIL || process.env.ADMIN_EMAIL || 'kontakt@topgartengeraete.de';
    const storeName = 'Top Gartengeräte';

    // 3. Send immediate notification to Admin
    try {
      const { sendEmail } = await import('@/lib/mailer');
      const nowStr = new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });

      await sendEmail({
        to: adminEmail,
        subject: sanitizeEmailHeader(`[TOP GARTENGERÄTE]: Neue Newsletter-Anmeldung: ${email}`),
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.5; padding: 25px; background: #ffffff;">
            <div style="font-size: 20px; font-weight: bold; color: #107b46; margin-bottom: 20px;">Top Gartengeräte</div>
            <h1 style="font-size: 20px; color: #107b46; margin-top: 0; margin-bottom: 15px;">📬 Neue Newsletter-Anmeldung</h1>
            <p style="font-size: 14px; color: #475569;">Ein neuer Besucher hat sich soeben für den Newsletter von <strong>${escapeHtml(storeName)}</strong> angemeldet:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px; background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <tr>
                <td style="padding: 10px; font-size: 13px; font-weight: bold; width: 120px; color: #64748b;">E-Mail:</td>
                <td style="padding: 10px; font-size: 13px;">
                  <a href="mailto:${escapeHtml(email)}" style="color: #107b46; text-decoration: none; font-weight: 600;">${escapeHtml(email)}</a>
                </td>
              </tr>
              <tr style="border-top: 1px solid #e2e8f0;">
                <td style="padding: 10px; font-size: 13px; font-weight: bold; color: #64748b;">Datum:</td>
                <td style="padding: 10px; font-size: 13px; color: #0f172a;">${nowStr}</td>
              </tr>
            </table>
            
            <div style="border-top: 1px solid #e2e8f0; margin-top: 30px; padding-top: 20px; text-align: center; font-size: 11px; color: #107b46;">
              <strong>${escapeHtml(storeName)}</strong> • Automatische Admin-Benachrichtigung
            </div>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('[NEWSLETTER] Failed to send admin notification email:', emailErr);
    }

    // 4. Create in-app notification for admin
    try {
      await prisma.notification.create({
        data: {
          isAdmin: true,
          type: 'SYSTEM',
          message: `Neue Newsletter-Anmeldung: ${email}`,
          link: '/admin/settings',
          isRead: false,
        }
      });
    } catch (notifErr) {
      console.error('[NEWSLETTER] Error creating admin notification:', notifErr);
    }

    // 5. Send Welcome email with coupon code to subscriber
    try {
      const { sendNewsletterWelcomeEmail } = await import('@/lib/mailer');
      await sendNewsletterWelcomeEmail(email);
    } catch (clientEmailErr) {
      console.error('[NEWSLETTER] Failed to send welcome email to subscriber:', clientEmailErr);
    }

    return {
      success: true,
      redirectUrl: '/thank-you',
      message: 'Vielen Dank für Ihre Anmeldung! Sie werden weitergeleitet...'
    };
  } catch (error) {
    console.error('Newsletter submission error:', error);
    return { error: 'Beim Verarbeiten Ihrer Anmeldung ist ein Fehler aufgetreten.' };
  }
}
