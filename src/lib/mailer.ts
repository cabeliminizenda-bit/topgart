/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import nodemailer from 'nodemailer';
import prisma from '@/lib/prisma';

// HTML escape utility to prevent XSS in email templates
function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Fetch SMTP settings, Resend API key and store branding
async function getTransporter() {
  let settingsDb: any[] = [];
  try {
    settingsDb = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'SMTP_HOST',
            'SMTP_PORT',
            'SMTP_USER',
            'SMTP_PASS',
            'SMTP_FROM',
            'HEADER_LOGO_IMAGE',
            'STYLE2_LOGO',
            'STORE_NAME',
            'NEXT_PUBLIC_STORE_NAME',
            'CONTACT_ADDRESS',
            'FOOTER_ADDRESS_1',
            'CONTACT_EMAIL_DISPLAY',
            'FOOTER_SUPPORT_EMAIL',
            'RESEND_API_KEY'
          ]
        }
      }
    });
  } catch (dbErr) {
    console.error('[getTransporter] Could not read settings from DB:', dbErr);
  }

  const settings = settingsDb.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);

  const storeName = settings.STORE_NAME || settings.NEXT_PUBLIC_STORE_NAME || process.env.NEXT_PUBLIC_STORE_NAME || "HLG Hausgeräte";
  const storeEmail = settings.CONTACT_EMAIL_DISPLAY || settings.FOOTER_SUPPORT_EMAIL || 'info@hlghausgeraete.de';
  const storeAddress = settings.CONTACT_ADDRESS || settings.FOOTER_ADDRESS_1 || 'Borseler Chaussee 123, 22453 Hamburg, Deutschland';
  const logo = settings.HEADER_LOGO_IMAGE || settings.STYLE2_LOGO || '';

  // Clean from address: avoid gamingbm.com or bare 'resend' username
  let from = settings.SMTP_FROM || `"${storeName}" <info@hlghausgeraete.de>`;
  if (from.includes('gamingbm.com') || from.includes('<resend>')) {
    from = `"${storeName}" <info@hlghausgeraete.de>`;
  }

  const resendApiKey = process.env.RESEND_API_KEY || settings.RESEND_API_KEY || (settings.SMTP_PASS?.startsWith('re_') ? settings.SMTP_PASS : null);

  let transporter: any = null;
  if (settings.SMTP_HOST && settings.SMTP_USER && settings.SMTP_PASS) {
    try {
      transporter = nodemailer.createTransport({
        host: settings.SMTP_HOST,
        port: parseInt(settings.SMTP_PORT || '587', 10),
        secure: settings.SMTP_PORT === '465',
        auth: {
          user: settings.SMTP_USER,
          pass: settings.SMTP_PASS,
        },
      });
    } catch (e) {
      console.error('[getTransporter] Failed to create nodemailer transport:', e);
    }
  }

  return {
    transporter,
    from,
    logo,
    storeName,
    storeEmail,
    storeAddress,
    resendApiKey,
  };
}

// General email sender (Resend API with auto-fallback + SMTP fallback)
export async function sendEmail({
  to,
  subject,
  html,
  attachments,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  attachments?: any[];
  replyTo?: string;
}) {
  const targetEmail = String(to || '').trim().toLowerCase();
  if (!targetEmail) {
    console.error('[sendEmail] Error: No recipient email specified.');
    return { success: false, error: 'Keine Empfänger-E-Mail angegeben.' };
  }

  try {
    const { transporter, from, storeName, storeEmail, resendApiKey } = await getTransporter();

    // 1. Primary delivery: Resend HTTP API (Fastest and serverless-safe)
    if (resendApiKey && resendApiKey.startsWith('re_')) {
      try {
        const formattedAttachments = (attachments || []).map((att: any) => {
          let content = att.content;
          if (Buffer.isBuffer(content)) {
            content = content.toString('base64');
          } else if (typeof content === 'string') {
            content = Buffer.from(content).toString('base64');
          }
          return {
            filename: att.filename || 'attachment.pdf',
            content: content,
          };
        });

        const resendPayload: any = {
          from,
          to: [targetEmail],
          subject,
          html,
          reply_to: replyTo || storeEmail,
        };
        if (formattedAttachments.length > 0) {
          resendPayload.attachments = formattedAttachments;
        }

        console.log(`[sendEmail] Sending via Resend API to: ${targetEmail} | Subject: "${subject}"`);
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(resendPayload),
        });

        const data = await res.json();
        if (res.ok && data?.id) {
          console.log(`[sendEmail] Successfully sent via Resend API! Message ID: ${data.id}`);
          return { success: true, messageId: data.id };
        }

        // Check if custom domain is unverified in Resend, retry with onboarding@resend.dev
        const errMsg = String(data?.message || '');
        if (errMsg.includes('not verified') || errMsg.includes('domain')) {
          console.warn(`[sendEmail] Resend domain not verified: ${errMsg}. Retrying with onboarding@resend.dev...`);
          resendPayload.from = `${storeName} <onboarding@resend.dev>`;
          const retryRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(resendPayload),
          });
          const retryData = await retryRes.json();
          if (retryRes.ok && retryData?.id) {
            console.log(`[sendEmail] Successfully sent via Resend onboarding fallback! ID: ${retryData.id}`);
            return { success: true, messageId: retryData.id };
          }
          console.error('[sendEmail] Resend onboarding fallback failed:', retryData);
        } else {
          console.error('[sendEmail] Resend API error response:', data);
        }
      } catch (resendErr) {
        console.error('[sendEmail] Resend API call threw exception:', resendErr);
      }
    }

    // 2. Secondary delivery: Nodemailer SMTP
    if (transporter) {
      try {
        console.log(`[sendEmail] Attempting SMTP delivery to: ${targetEmail}`);
        const info = await transporter.sendMail({
          from,
          to: targetEmail,
          replyTo: replyTo || storeEmail,
          subject,
          html,
          attachments,
        });

        console.log(`[sendEmail] Successfully sent via SMTP! Message ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
      } catch (smtpErr) {
        console.error('[sendEmail] SMTP delivery failed:', smtpErr);
      }
    }

    console.error(`[sendEmail] All email delivery attempts failed for: ${targetEmail}`);
    return { success: false, error: 'E-Mail konnte über keinen Dienst versendet werden.' };
  } catch (error) {
    console.error('[sendEmail] Unexpected error in sendEmail:', error);
    return { success: false, error };
  }
}

// FORMATTER HELPERS — German (de-DE)
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(price);
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'long' }).format(date);
};

const formatPaymentMethodDE = (method: string) => {
  switch (method?.toUpperCase()) {
    case 'BANK_TRANSFER':
      return 'Banküberweisung';
    case 'STRIPE':
      return 'Kreditkarte / Debitkarte';
    case 'PAYPAL':
      return 'PayPal';
    case 'KLARNA':
      return 'Klarna';
    case 'SOFORT':
      return 'Sofortüberweisung';
    default:
      return method || 'N/A';
  }
};

// --- EMAIL TEMPLATES (100% PORTUGUÊS DE PORTUGAL) ---

// 1. Client Order Confirmation (mit Rechnung im Anhang)
export async function sendClientOrderConfirmation(order: any, userEmail: string, userName: string) {
  try {
    const { logo, storeName, storeEmail, storeAddress } = await getTransporter().catch(() => ({
      logo: '',
      storeName: 'HLG Hausgeräte',
      storeEmail: 'info@hlg-hausgeraete.de',
      storeAddress: 'Borseler Chaussee 123, 22453 Hamburg'
    }));
    
    const logoHtml = logo
      ? `<div style="text-align: left; margin-bottom: 25px;"><img src="${logo}" alt="${escapeHtml(storeName)}" style="max-height: 48px; object-contain: contain;"></div>`
      : `<div style="font-size: 20px; font-weight: bold; color: #107b46; margin-bottom: 25px;">${escapeHtml(storeName)}</div>`;

    let metadata: any = {};
    if (order.destinationAddress) {
      try {
        metadata = typeof order.destinationAddress === 'string' ? JSON.parse(order.destinationAddress) : order.destinationAddress;
      } catch (e) {}
    }

    const subTotal = metadata?.subTotal || order.orderItems?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || order.total;
    const shippingCostStr = metadata?.shippingCost === 0
      ? "Kostenlos"
      : (metadata?.shippingCost ? formatPrice(metadata.shippingCost) : "0,00 €");
    const shippingMethod = metadata?.shippingMethodName && !metadata.shippingMethodName.toLowerCase().includes('kostenlos')
      ? `(${metadata.shippingMethodName})`
      : "";
    
    // Addresses
    const b = metadata?.billing || {};
    const s = metadata?.shipping || b;
    const billingName = escapeHtml(`${b.firstName || ''} ${b.lastName || ''}`.trim() || userName || 'geschätzter Kunde');
    const shippingName = escapeHtml(`${s.firstName || ''} ${s.lastName || ''}`.trim()) || billingName;
    const billingAddressHtml = `${escapeHtml(b.address1 || '')}<br/>${escapeHtml(b.postalCode || '')} ${escapeHtml(b.city || '')}${b.country ? `, ${escapeHtml(b.country)}` : ''}`;
    const shippingAddressHtml = `${escapeHtml(s.address1 || '')}<br/>${escapeHtml(s.postalCode || '')} ${escapeHtml(s.city || '')}${s.country ? `, ${escapeHtml(s.country)}` : ''}`;
    
    const paymentMethodStr = formatPaymentMethodDE(order.paymentMethod);
    const orderId = order.id.slice(-6).toUpperCase();

    const itemsHtml = order.orderItems?.map((item: any) => {
      let imageUrl = '';
      if (item.product?.images && Array.isArray(item.product.images) && item.product.images.length > 0) {
        imageUrl = typeof item.product.images[0] === 'string' ? item.product.images[0] : item.product.images[0].url;
      } else if (typeof item.product?.images === 'string') {
        try {
          const imgs = JSON.parse(item.product.images);
          if (imgs.length > 0) imageUrl = imgs[0];
        } catch(e) {}
      }

      const safeImageUrl = imageUrl && /^https?:\/\//i.test(imageUrl) ? escapeHtml(imageUrl) : '';
      const imgTag = safeImageUrl
        ? `<img src="${safeImageUrl}" alt="${escapeHtml(item.product?.title || 'Artikel')}" style="width: 52px; height: 52px; object-fit: contain; border-radius: 6px; border: 1px solid #eee; margin-right: 15px;" />`
        : '';
      
      const sku = item.product?.gtin || item.product?.sku ? `<span style="font-size: 11px; color: #888;">Art.-Nr.: #${escapeHtml(item.product.gtin || item.product.sku)}</span>` : '';

      return `
        <tr style="border-bottom: 1px dashed #e5e7eb;">
          <td style="padding: 14px 0;">
            <table style="width: 100%; border: none;">
              <tr>
                ${imgTag ? `<td style="width: 65px; vertical-align: middle;">${imgTag}</td>` : ''}
                <td style="vertical-align: middle;">
                  <strong style="font-size: 13px; color: #1e293b;">${escapeHtml(item.product?.title || 'Artikel')}</strong><br/>
                  ${sku}
                </td>
              </tr>
            </table>
          </td>
          <td style="padding: 14px 0; text-align: center; vertical-align: middle; color: #64748b; font-size: 13px;">×${item.quantity}</td>
          <td style="padding: 14px 0; text-align: right; vertical-align: middle; color: #1e293b; font-weight: 600; font-size: 13px;">${formatPrice(item.price)}</td>
        </tr>
      `;
    }).join('') || '';

    // Bank Details logic for German customers
    let bankDetailsHtml = '';
    if (order.paymentMethod === 'BANK_TRANSFER') {
      const dbSettings = await prisma.setting.findMany({
        where: { key: { in: ['BANK_TRANSFER_ACCOUNT_HOLDER', 'BANK_TRANSFER_IBAN', 'BANK_TRANSFER_BIC', 'BANK_TRANSFER_BANK_NAME', 'BANK_TRANSFER_INSTRUCTIONS'] } }
      });
      const settings = dbSettings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);
      
      bankDetailsHtml = `
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-top: 25px; margin-bottom: 25px;">
          <h4 style="margin-top: 0; margin-bottom: 12px; color: #15803d; font-size: 15px; font-weight: bold;">
            💳 Bankverbindung für Ihre Überweisung
          </h4>
          <p style="font-size: 13px; color: #14532d; margin-bottom: 15px; line-height: 1.5;">
            Bitte überweisen Sie den fälligen Betrag auf das unten angegebene Bankkonto. Bitte geben Sie unbedingt Ihre Bestellnummer <strong>#${orderId}</strong> als Verwendungszweck an.
          </p>
          <table style="width: 100%; font-size: 13px; color: #1e293b; line-height: 1.8;">
            ${settings.BANK_TRANSFER_ACCOUNT_HOLDER ? `<tr><td style="width: 140px; color: #166534;">Kontoinhaber:</td><td><strong>${escapeHtml(settings.BANK_TRANSFER_ACCOUNT_HOLDER)}</strong></td></tr>` : ''}
            ${settings.BANK_TRANSFER_IBAN ? `<tr><td style="color: #166534;">IBAN:</td><td><strong style="letter-spacing: 1px; font-family: monospace;">${escapeHtml(settings.BANK_TRANSFER_IBAN)}</strong></td></tr>` : ''}
            ${settings.BANK_TRANSFER_BIC ? `<tr><td style="color: #166534;">BIC / SWIFT:</td><td><strong>${escapeHtml(settings.BANK_TRANSFER_BIC)}</strong></td></tr>` : ''}
            ${settings.BANK_TRANSFER_BANK_NAME ? `<tr><td style="color: #166534;">Bank:</td><td><strong>${escapeHtml(settings.BANK_TRANSFER_BANK_NAME)}</strong></td></tr>` : ''}
          </table>
          <p style="font-size: 12px; color: #15803d; margin-top: 15px; margin-bottom: 0;">
            Nach Eingang Ihrer Zahlung wird Ihre Bestellung umgehend für den Versand vorbereitet.
          </p>
        </div>
      `;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; padding: 25px; background: #ffffff;">
        ${logoHtml}
        <h1 style="font-size: 22px; color: #0f172a; margin-top: 0; margin-bottom: 10px;">
          Vielen Dank für Ihre Bestellung, ${escapeHtml(userName) || 'geschätzter Kunde'}!
        </h1>
        <p style="font-size: 14px; color: #475569; margin-top: 0;">
          Wir freuen uns, den Eingang Ihrer Bestellung <strong>#${orderId}</strong> vom ${formatDate(new Date(order.createdAt))} zu bestätigen. Ihre offizielle Rechnung finden Sie im Anhang als PDF.
        </p>
        
        <h3 style="font-size: 15px; font-weight: bold; margin-top: 30px; margin-bottom: 12px; color: #0f172a; border-bottom: 2px solid #107b46; padding-bottom: 6px;">
          Bestellübersicht #${orderId}
        </h3>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead style="text-align: left; border-bottom: 1px solid #e2e8f0;">
            <tr>
              <th style="padding-bottom: 10px; font-weight: bold; font-size: 12px; color: #64748b; text-transform: uppercase;">Artikel</th>
              <th style="padding-bottom: 10px; text-align: center; font-weight: bold; font-size: 12px; color: #64748b; text-transform: uppercase;">Menge</th>
              <th style="padding-bottom: 10px; text-align: right; font-weight: bold; font-size: 12px; color: #64748b; text-transform: uppercase;">Preis</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div style="margin-top: 20px; background-color: #f8fafc; border-radius: 6px; padding: 15px;">
          <table style="width: 100%; font-size: 13px; color: #475569; line-height: 2;">
            <tr>
              <td>Zwischensumme:</td>
              <td style="text-align: right; color: #0f172a;">${formatPrice(subTotal)}</td>
            </tr>
            <tr>
              <td>Versandkosten: ${shippingMethod}</td>
              <td style="text-align: right; color: #0f172a;">${shippingCostStr}</td>
            </tr>
            <tr style="color: #107b46; font-size: 16px; border-top: 1px solid #e2e8f0;">
              <td><strong>Gesamtbetrag (inkl. MwSt.):</strong></td>
              <td style="text-align: right;"><strong>${formatPrice(order.total)}</strong></td>
            </tr>
            <tr>
              <td style="font-size: 12px; color: #64748b;">Zahlungsmethode:</td>
              <td style="text-align: right; font-size: 12px; color: #0f172a; font-weight: 600;">${paymentMethodStr}</td>
            </tr>
          </table>
        </div>

        ${bankDetailsHtml}

        <div style="border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; margin-top: 30px; padding-top: 20px; padding-bottom: 20px;">
          <table style="width: 100%; font-size: 12px; color: #334155; line-height: 1.5;">
            <tr>
              <td style="vertical-align: top; width: 50%; padding-right: 10px;">
                <strong style="font-size: 13px; color: #0f172a;">Rechnungsadresse</strong><br/>
                <div style="margin-top: 8px; color: #475569;">
                  ${billingName}<br/>
                  ${billingAddressHtml}<br/>
                  ${b.phone ? `<span style="color: #107b46;">Tel: ${escapeHtml(b.phone)}</span><br/>` : ''}
                  ${b.email ? `<a href="mailto:${b.email}" style="color: #2563eb; text-decoration: underline;">${escapeHtml(b.email)}</a>` : ''}
                </div>
              </td>
              <td style="vertical-align: top; width: 50%; padding-left: 10px;">
                <strong style="font-size: 13px; color: #0f172a;">Lieferadresse</strong><br/>
                <div style="margin-top: 8px; color: #475569;">
                  ${shippingName}<br/>
                  ${shippingAddressHtml}<br/>
                  ${s.phone ? `<span style="color: #107b46;">Tel: ${escapeHtml(s.phone)}</span>` : ''}
                </div>
              </td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin-top: 35px; margin-bottom: 30px; font-size: 13px; color: #475569;">
          <p style="margin-bottom: 8px;">Vielen Dank für Ihren Einkauf und Ihr Vertrauen in HLG Hausgeräte!</p>
          <p style="margin-top: 0;">Bei Fragen zu Ihrer Lieferung erreichen Sie unseren Kundenservice unter <a href="mailto:${storeEmail}" style="color: #107b46; font-weight: bold; text-decoration: none;">${storeEmail}</a>.</p>
        </div>
        
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
          <strong style="color: #64748b;">${escapeHtml(storeName)}</strong><br/>
          ${escapeHtml(storeAddress)}<br/>
          E-Mail: ${storeEmail}
        </div>
      </div>
    `;

    const { generateInvoicePDF } = await import('./pdfGenerator');
    let pdfAttachment: any = null;
    try {
      const pdfBuffer = await generateInvoicePDF(order);
      pdfAttachment = {
        filename: `rechnung-${orderId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      };
    } catch (pdfErr) {
      console.error('Fehler bei der PDF-Rechnungserstellung:', pdfErr);
    }

    return sendEmail({
      to: userEmail,
      subject: `Bestellbestätigung #${orderId} - ${storeName}`,
      html,
      attachments: pdfAttachment ? [pdfAttachment] : []
    });
  } catch (e) {
    console.error(e);
  }
}

// 2. Admin New Order Notification
export async function sendAdminOrderNotification(order: any, adminEmail: string, customerDetails: any) {
  try {
    const { logo, storeName } = await getTransporter().catch(() => ({
      logo: '',
      storeName: 'HLG Hausgeräte'
    }));
    
    const logoHtml = logo
      ? `<div style="text-align: left; margin-bottom: 20px;"><img src="${logo}" alt="${escapeHtml(storeName)}" style="max-height: 40px;"></div>`
      : `<div style="font-size: 18px; font-weight: bold; color: #ea580c; margin-bottom: 20px;">${escapeHtml(storeName)}</div>`;

    let metadata: any = {};
    if (order.destinationAddress) {
      try {
        metadata = typeof order.destinationAddress === 'string' ? JSON.parse(order.destinationAddress) : order.destinationAddress;
      } catch (e) {}
    }

    const subTotal = metadata?.subTotal || order.orderItems?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || order.total;
    const shippingCostStr = metadata?.shippingCost === 0
      ? "Kostenlos"
      : (metadata?.shippingCost ? formatPrice(metadata.shippingCost) : "0,00 €");
    const shippingMethod = metadata?.shippingMethodName && !metadata.shippingMethodName.toLowerCase().includes('kostenlos')
      ? `(${metadata.shippingMethodName})`
      : "";
    
    // Addresses
    const b = metadata?.billing || {};
    const s = metadata?.shipping || b;
    const billingName = escapeHtml(`${b.firstName || ''} ${b.lastName || ''}`.trim() || customerDetails?.name || 'Kunde');
    const shippingName = escapeHtml(`${s.firstName || ''} ${s.lastName || ''}`.trim()) || billingName;
    const billingAddressHtml = `${escapeHtml(b.address1 || '')}<br/>${escapeHtml(b.postalCode || '')} ${escapeHtml(b.city || '')}${b.country ? `, ${escapeHtml(b.country)}` : ''}`;
    const shippingAddressHtml = `${escapeHtml(s.address1 || '')}<br/>${escapeHtml(s.postalCode || '')} ${escapeHtml(s.city || '')}${s.country ? `, ${escapeHtml(s.country)}` : ''}`;
    
    const paymentMethodStr = formatPaymentMethodDE(order.paymentMethod);
    const orderId = order.id.slice(-6).toUpperCase();

    const itemsHtml = order.orderItems?.map((item: any) => {
      let imageUrl = '';
      if (item.product?.images && Array.isArray(item.product.images) && item.product.images.length > 0) {
        imageUrl = typeof item.product.images[0] === 'string' ? item.product.images[0] : item.product.images[0].url;
      } else if (typeof item.product?.images === 'string') {
        try {
          const imgs = JSON.parse(item.product.images);
          if (imgs.length > 0) imageUrl = imgs[0];
        } catch(e) {}
      }

      const safeImageUrl = imageUrl && /^https?:\/\//i.test(imageUrl) ? escapeHtml(imageUrl) : '';
      const imgTag = safeImageUrl
        ? `<img src="${safeImageUrl}" alt="${escapeHtml(item.product?.title || 'Artikel')}" style="width: 48px; height: 48px; object-fit: contain; border-radius: 4px; margin-right: 12px; border: 1px solid #eee;" />`
        : '';
      
      const sku = item.product?.gtin || item.product?.sku ? `(#${escapeHtml(item.product.gtin || item.product.sku)})` : '';

      return `
        <tr style="border-bottom: 1px dashed #e2e8f0;">
          <td style="padding: 12px 0;">
            <table style="width: 100%; border: none;">
              <tr>
                ${imgTag ? `<td style="width: 60px; vertical-align: middle;">${imgTag}</td>` : ''}
                <td style="vertical-align: middle;">
                  <strong style="font-size: 13px; color: #1e293b;">${escapeHtml(item.product?.title || 'Artikel')}</strong><br/>
                  <span style="font-size: 11px; color: #64748b;">${sku}</span>
                </td>
              </tr>
            </table>
          </td>
          <td style="padding: 12px 0; text-align: center; vertical-align: middle; color: #64748b; font-size: 13px;">×${item.quantity}</td>
          <td style="padding: 12px 0; text-align: right; vertical-align: middle; color: #1e293b; font-weight: 600; font-size: 13px;">${formatPrice(item.price)}</td>
        </tr>
      `;
    }).join('') || '';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; padding: 25px; background: #ffffff;">
        ${logoHtml}
        <h1 style="font-size: 22px; color: #0f172a; margin-top: 0; margin-bottom: 10px;">
          Du hast eine neue Bestellung: Nr. #${orderId}
        </h1>
        <p style="font-size: 14px; color: #475569;">
          Sie haben eine neue Bestellung von <strong>${billingName}</strong> am ${formatDate(new Date(order.createdAt))} erhalten.
        </p>
        
        <h3 style="font-size: 15px; font-weight: bold; margin-top: 30px; margin-bottom: 12px; color: #0f172a; border-bottom: 2px solid #107b46; padding-bottom: 6px;">
          Bestellübersicht #${orderId}
        </h3>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead style="text-align: left; border-bottom: 1px solid #e2e8f0;">
            <tr>
              <th style="padding-bottom: 10px; font-weight: bold; font-size: 12px; color: #64748b; text-transform: uppercase;">Artikel</th>
              <th style="padding-bottom: 10px; text-align: center; font-weight: bold; font-size: 12px; color: #64748b; text-transform: uppercase;">Menge</th>
              <th style="padding-bottom: 10px; text-align: right; font-weight: bold; font-size: 12px; color: #64748b; text-transform: uppercase;">Preis</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div style="margin-top: 20px; background-color: #f8fafc; border-radius: 6px; padding: 15px;">
          <table style="width: 100%; font-size: 13px; color: #475569; line-height: 2;">
            <tr>
              <td>Zwischensumme:</td>
              <td style="text-align: right; color: #0f172a;">${formatPrice(subTotal)}</td>
            </tr>
            <tr>
              <td>Versandkosten: ${shippingMethod}</td>
              <td style="text-align: right; color: #0f172a;">${shippingCostStr}</td>
            </tr>
            <tr style="color: #107b46; font-size: 16px; border-top: 1px solid #e2e8f0;">
              <td><strong>Gesamtbetrag:</strong></td>
              <td style="text-align: right;"><strong>${formatPrice(order.total)}</strong></td>
            </tr>
            <tr>
              <td style="font-size: 12px; color: #64748b;">Zahlungsmethode:</td>
              <td style="text-align: right; font-size: 12px; color: #0f172a; font-weight: bold;">${paymentMethodStr}</td>
            </tr>
          </table>
        </div>

        <div style="border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; margin-top: 30px; padding-top: 20px; padding-bottom: 20px;">
          <table style="width: 100%; font-size: 12px; color: #334155; line-height: 1.5;">
            <tr>
              <td style="vertical-align: top; width: 50%; padding-right: 10px;">
                <strong style="font-size: 13px; color: #0f172a;">Rechnungsdaten</strong><br/>
                <div style="margin-top: 8px; color: #475569;">
                  ${billingName}<br/>
                  ${billingAddressHtml}<br/>
                  ${b.phone ? `<span style="color: #107b46;">Tel: ${escapeHtml(b.phone)}</span><br/>` : ''}
                  ${b.email ? `<a href="mailto:${b.email}" style="color: #2563eb; text-decoration: underline;">${escapeHtml(b.email)}</a>` : ''}
                </div>
              </td>
              <td style="vertical-align: top; width: 50%; padding-left: 10px;">
                <strong style="font-size: 13px; color: #0f172a;">Lieferdaten</strong><br/>
                <div style="margin-top: 8px; color: #475569;">
                  ${shippingName}<br/>
                  ${shippingAddressHtml}<br/>
                  ${s.phone ? `<span style="color: #107b46;">Tel: ${escapeHtml(s.phone)}</span>` : ''}
                </div>
              </td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin-top: 35px; margin-bottom: 25px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://hlghausgeraete.de'}/admin/orders/${order.id}" style="background-color: #107b46; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">
            Bestellung im Admin-Panel anzeigen
          </a>
        </div>
      </div>
    `;

    const customerEmail = customerDetails?.email || b.email || order.user?.email;
    const customerFullName = `${b.firstName || ''} ${b.lastName || ''}`.trim() || customerDetails?.name;
    const replyTo = customerEmail
      ? (customerFullName ? `"${customerFullName}" <${customerEmail}>` : customerEmail)
      : undefined;

    return sendEmail({
      to: adminEmail,
      replyTo,
      subject: `[HLG HAUSGERÄTE]: Du hast eine neue Bestellung: Nr. #${orderId}`,
      html
    });
  } catch (e) {
    console.error(e);
  }
}

// 3. Client Order Status Update (Versandt / Zugestellt / Storniert / In Bearbeitung)
export async function sendOrderStatusUpdate(order: any, userEmail: string, status: string) {
  try {
    const { logo, storeName, storeEmail, storeAddress } = await getTransporter().catch(() => ({
      logo: '',
      storeName: 'HLG Hausgeräte',
      storeEmail: 'info@hlg-hausgeraete.de',
      storeAddress: 'Borseler Chaussee 123, 22453 Hamburg'
    }));
    
    const logoHtml = logo
      ? `<div style="text-align: left; margin-bottom: 25px;"><img src="${logo}" alt="${escapeHtml(storeName)}" style="max-height: 48px;"></div>`
      : `<div style="font-size: 20px; font-weight: bold; color: #107b46; margin-bottom: 25px;">${escapeHtml(storeName)}</div>`;

    const orderId = order.id.slice(-6).toUpperCase();
    let title = "Ihre Bestellung wurde aktualisiert";
    let message = `Der Status Ihrer Bestellung <strong>#${orderId}</strong> wurde aktualisiert.`;
    let color = "#1e293b";
    let subject = `Aktualisierung Ihrer Bestellung #${orderId} - ${storeName}`;

    if (status === 'SHIPPED') {
      title = "Ihre Bestellung ist unterwegs! 🚚";
      message = `Wir freuen uns, Ihnen mitteilen zu können, dass Ihre Bestellung <strong>#${orderId}</strong> versandt wurde und sich auf dem Weg zu Ihrer Lieferadresse befindet.`;
      color = "#107b46";
      subject = `Ihre Bestellung #${orderId} wurde versandt! 🚚 - ${storeName}`;
    } else if (status === 'CANCELLED') {
      title = "Information zu Ihrer Bestellung";
      message = `Wir informieren Sie darüber, dass Ihre Bestellung <strong>#${orderId}</strong> storniert wurde. Falls die Zahlung bereits erfolgt ist, wird die Erstattung umgehend veranlasst.`;
      color = "#dc2626";
      subject = `Stornierung Ihrer Bestellung #${orderId} - ${storeName}`;
    } else if (status === 'DELIVERED') {
      title = "Ihre Bestellung wurde erfolgreich zugestellt! 📦";
      message = `Ihre Bestellung <strong>#${orderId}</strong> wurde als zugestellt markiert. Wir hoffen, dass Sie mit Ihren Geräten vollkommen zufrieden sind!`;
      color = "#107b46";
      subject = `Ihre Bestellung #${orderId} wurde zugestellt! 📦 - ${storeName}`;
    } else if (status === 'PROCESSING') {
      title = "Ihre Bestellung wird vorbereitet ⚙️";
      message = `Ihre Bestellung <strong>#${orderId}</strong> befindet sich in Bearbeitung und wird sorgfältig von unserem Logistik-Team vorbereitet.`;
      color = "#107b46";
      subject = `Ihre Bestellung #${orderId} wird vorbereitet ⚙️ - ${storeName}`;
    }

    let metadata: any = {};
    if (order.destinationAddress) {
      try {
        metadata = typeof order.destinationAddress === 'string' ? JSON.parse(order.destinationAddress) : order.destinationAddress;
      } catch (e) {}
    }

    const subTotal = metadata?.subTotal || order.orderItems?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || order.total;
    const shippingCostStr = metadata?.shippingCost === 0
      ? "Kostenlos"
      : (metadata?.shippingCost ? formatPrice(metadata.shippingCost) : "0,00 €");
    const shippingMethod = metadata?.shippingMethodName && !metadata.shippingMethodName.toLowerCase().includes('kostenlos')
      ? `(${metadata.shippingMethodName})`
      : "";
    
    const b = metadata?.billing || {};
    const s = metadata?.shipping || b;
    const billingName = escapeHtml(`${b.firstName || ''} ${b.lastName || ''}`.trim() || 'geschätzter Kunde');
    const shippingName = escapeHtml(`${s.firstName || ''} ${s.lastName || ''}`.trim()) || billingName;
    const billingAddressHtml = `${escapeHtml(b.address1 || '')}<br/>${escapeHtml(b.postalCode || '')} ${escapeHtml(b.city || '')}${b.country ? `, ${escapeHtml(b.country)}` : ''}`;
    const shippingAddressHtml = `${escapeHtml(s.address1 || '')}<br/>${escapeHtml(s.postalCode || '')} ${escapeHtml(s.city || '')}${s.country ? `, ${escapeHtml(s.country)}` : ''}`;
    const paymentMethodStr = formatPaymentMethodDE(order.paymentMethod);

    let itemsHtml = '';
    if (order.orderItems && order.orderItems.length > 0) {
      itemsHtml = order.orderItems.map((item: any) => {
        let imageUrl = '';
        if (item.product?.images && Array.isArray(item.product.images) && item.product.images.length > 0) {
          imageUrl = typeof item.product.images[0] === 'string' ? item.product.images[0] : item.product.images[0].url;
        } else if (typeof item.product?.images === 'string') {
          try {
            const imgs = JSON.parse(item.product.images);
            if (imgs.length > 0) imageUrl = imgs[0];
          } catch(e) {}
        }
  
        const safeImageUrl = imageUrl && /^https?:\/\//i.test(imageUrl) ? escapeHtml(imageUrl) : '';
        const imgTag = safeImageUrl
          ? `<img src="${safeImageUrl}" alt="Artikel" style="width: 48px; height: 48px; object-fit: contain; border-radius: 4px; margin-right: 12px; border: 1px solid #eee;" />`
          : '';

        return `
          <tr style="border-bottom: 1px dashed #e2e8f0;">
            <td style="padding: 12px 0;">
              <table style="width: 100%; border: none;">
                <tr>
                  ${imgTag ? `<td style="width: 60px; vertical-align: middle;">${imgTag}</td>` : ''}
                  <td style="vertical-align: middle;">
                    <span style="font-size: 13px; color: #1e293b; font-weight: 600;">${escapeHtml(item.product?.title || 'Artikel')}</span>
                  </td>
                </tr>
              </table>
            </td>
            <td style="padding: 12px 0; text-align: center; vertical-align: middle; color: #64748b; font-size: 13px;">×${item.quantity}</td>
            <td style="padding: 12px 0; text-align: right; vertical-align: middle; color: #1e293b; font-weight: 600; font-size: 13px;">${formatPrice(item.price)}</td>
          </tr>
        `;
      }).join('');
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; padding: 25px; background: #ffffff;">
        ${logoHtml}
        <h1 style="font-size: 22px; color: ${color}; margin-top: 0; margin-bottom: 12px;">${title}</h1>
        <p style="font-size: 14px; color: #475569;">Hallo ${billingName},</p>
        <p style="font-size: 14px; color: #475569;">${message}</p>
        
        <h3 style="font-size: 15px; font-weight: bold; margin-top: 30px; margin-bottom: 12px; color: #0f172a; border-bottom: 2px solid #107b46; padding-bottom: 6px;">
          Bestellübersicht #${orderId}
        </h3>
        
        ${itemsHtml ? `
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead style="text-align: left; border-bottom: 1px solid #e2e8f0;">
            <tr>
              <th style="padding-bottom: 10px; font-weight: bold; font-size: 12px; color: #64748b; text-transform: uppercase;">Artikel</th>
              <th style="padding-bottom: 10px; text-align: center; font-weight: bold; font-size: 12px; color: #64748b; text-transform: uppercase;">Menge</th>
              <th style="padding-bottom: 10px; text-align: right; font-weight: bold; font-size: 12px; color: #64748b; text-transform: uppercase;">Preis</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        ` : ''}
        
        <div style="margin-top: 20px; background-color: #f8fafc; border-radius: 6px; padding: 15px;">
          <table style="width: 100%; font-size: 13px; color: #475569; line-height: 2;">
            <tr>
              <td>Zwischensumme:</td>
              <td style="text-align: right; color: #0f172a;">${formatPrice(subTotal)}</td>
            </tr>
            <tr>
              <td>Versandkosten: ${shippingMethod}</td>
              <td style="text-align: right; color: #0f172a;">${shippingCostStr}</td>
            </tr>
            <tr style="color: #107b46; font-size: 16px; border-top: 1px solid #e2e8f0;">
              <td><strong>Gesamtbetrag:</strong></td>
              <td style="text-align: right;"><strong>${formatPrice(order.total)}</strong></td>
            </tr>
            <tr>
              <td style="font-size: 12px; color: #64748b;">Zahlungsart:</td>
              <td style="text-align: right; font-size: 12px; color: #0f172a;">${paymentMethodStr}</td>
            </tr>
          </table>
        </div>

        <div style="border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; margin-top: 30px; padding-top: 20px; padding-bottom: 20px;">
          <table style="width: 100%; font-size: 12px; color: #334155; line-height: 1.5;">
            <tr>
              <td style="vertical-align: top; width: 50%; padding-right: 10px;">
                <strong style="font-size: 13px; color: #0f172a;">Rechnungsadresse</strong><br/>
                <div style="margin-top: 8px; color: #475569;">
                  ${billingName}<br/>
                  ${billingAddressHtml}<br/>
                  ${b.phone ? `<span style="color: #107b46;">Tel: ${escapeHtml(b.phone)}</span><br/>` : ''}
                </div>
              </td>
              <td style="vertical-align: top; width: 50%; padding-left: 10px;">
                <strong style="font-size: 13px; color: #0f172a;">Lieferadresse</strong><br/>
                <div style="margin-top: 8px; color: #475569;">
                  ${shippingName}<br/>
                  ${shippingAddressHtml}<br/>
                  ${s.phone ? `<span style="color: #107b46;">Tel: ${escapeHtml(s.phone)}</span>` : ''}
                </div>
              </td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin-top: 35px; margin-bottom: 25px; font-size: 13px; color: #475569;">
          <p>Bei weiteren Fragen zu Ihrer Bestellung stehen wir Ihnen gerne unter <a href="mailto:${storeEmail}" style="color: #107b46; text-decoration: none; font-weight: bold;">${storeEmail}</a> zur Verfügung.</p>
        </div>
        
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 11px; color: #94a3b8;">
          <strong style="color: #64748b;">${escapeHtml(storeName)}</strong><br/>
          ${escapeHtml(storeAddress)}<br/>
          E-Mail: ${storeEmail}
        </div>
      </div>
    `;

    return sendEmail({
      to: userEmail,
      subject,
      html
    });
  } catch (e) {
    console.error(e);
  }
}

// 4. Abandoned Cart Recovery Email (Warenkorb-Erinnerung)
export async function sendAbandonedCartRecoveryEmail(cart: any, userEmail: string, userName: string, checkoutUrl: string) {
  try {
    const { logo, storeName, storeEmail, storeAddress } = await getTransporter().catch(() => ({
      logo: '',
      storeName: 'HLG Hausgeräte',
      storeEmail: 'info@hlg-hausgeraete.de',
      storeAddress: 'Borseler Chaussee 123, 22453 Hamburg'
    }));
    
    const logoHtml = logo
      ? `<div style="text-align: left; margin-bottom: 25px;"><img src="${logo}" alt="${escapeHtml(storeName)}" style="max-height: 48px;"></div>`
      : `<div style="font-size: 20px; font-weight: bold; color: #107b46; margin-bottom: 25px;">${escapeHtml(storeName)}</div>`;

    const couponMessage = "Nutzen Sie den Gutscheincode BH874XP für 25 € Sofortrabatt auf Ihren Einkauf!"; 

    let itemsHtml = '';
    if (Array.isArray(cart.cartData) && cart.cartData.length > 0) {
      const productIds = cart.cartData
        .map((i: any) => i?.productId)
        .filter((id: any): id is string => typeof id === 'string');

      const dbProducts = await prisma.product.findMany({
        where: { id: { in: productIds }, isDeleted: false },
        select: { id: true, title: true, price: true, images: true }
      });
      const dbMap = new Map(dbProducts.map(p => [p.id, p]));

      itemsHtml = cart.cartData.map((item: any) => {
        const dbProduct = item?.productId ? dbMap.get(item.productId) : null;
        const title = dbProduct?.title || item?.title || 'Artikel';
        const price = dbProduct?.price ?? (Number(item?.price) || 0);
        const rawImages = dbProduct?.images || item?.product?.images;

        let imageUrl = '';
        if (Array.isArray(rawImages) && rawImages.length > 0) {
          imageUrl = typeof rawImages[0] === 'string' ? rawImages[0] : (rawImages[0]?.url || '');
        } else if (typeof rawImages === 'string') {
          try {
            const parsed = JSON.parse(rawImages);
            if (Array.isArray(parsed) && parsed.length > 0) imageUrl = parsed[0];
          } catch {}
        }
  
        const safeImageUrl = imageUrl && /^https?:\/\//i.test(imageUrl) ? escapeHtml(imageUrl) : '';
        const imgTag = safeImageUrl
          ? `<img src="${safeImageUrl}" alt="Artikel" style="width: 50px; height: 50px; object-fit: contain; border-radius: 4px; margin-right: 15px; border: 1px solid #eee;" />`
          : '';
        const qty = Math.min(Math.max(1, Number(item?.quantity) || 1), 999);
  
        return `
          <tr style="border-bottom: 1px dashed #e2e8f0;">
            <td style="padding: 14px 0;">
              <table style="width: 100%; border: none;">
                <tr>
                  ${imgTag ? `<td style="width: 65px; vertical-align: middle;">${imgTag}</td>` : ''}
                  <td style="vertical-align: middle;">
                    <strong style="font-size: 13px; color: #1e293b;">${escapeHtml(title)}</strong>
                  </td>
                </tr>
              </table>
            </td>
            <td style="padding: 14px 0; text-align: center; vertical-align: middle; color: #64748b; font-size: 13px;">×${qty}</td>
            <td style="padding: 14px 0; text-align: right; vertical-align: middle; color: #1e293b; font-weight: 600; font-size: 13px;">${formatPrice(price)}</td>
          </tr>
        `;
      }).join('');
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; padding: 25px; background: #ffffff;">
        ${logoHtml}
        <h1 style="font-size: 22px; color: #0f172a; margin-top: 0; margin-bottom: 12px;">
          Ihre Artikel warten noch in Ihrem Warenkorb! 🛒
        </h1>
        <p style="font-size: 14px; color: #475569;">Hallo ${escapeHtml(userName) || 'geschätzter Kunde'},</p>
        <p style="font-size: 14px; color: #475569;">
          Wir haben bemerkt, dass Sie Artikel in unserem Online-Shop ausgewählt, Ihre Bestellung jedoch noch nicht abgeschlossen haben. Wir haben Ihre Auswahl für Sie reserviert, damit Sie den Kauf jederzeit bequem fortsetzen können.
        </p>
        
        <div style="background-color: #f0fdf4; border: 1px dashed #107b46; border-radius: 8px; padding: 16px; margin: 25px 0; text-align: center;">
          <p style="margin: 0; font-size: 14px; font-weight: bold; color: #15803d;">${couponMessage}</p>
        </div>

        <h3 style="font-size: 15px; font-weight: bold; margin-top: 30px; margin-bottom: 12px; color: #0f172a; border-bottom: 2px solid #107b46; padding-bottom: 6px;">
          Artikel in Ihrem Warenkorb
        </h3>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead style="text-align: left; border-bottom: 1px solid #e2e8f0;">
            <tr>
              <th style="padding-bottom: 10px; font-weight: bold; font-size: 12px; color: #64748b; text-transform: uppercase;">Artikel</th>
              <th style="padding-bottom: 10px; text-align: center; font-weight: bold; font-size: 12px; color: #64748b; text-transform: uppercase;">Menge</th>
              <th style="padding-bottom: 10px; text-align: right; font-weight: bold; font-size: 12px; color: #64748b; text-transform: uppercase;">Preis</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div style="margin-top: 35px; text-align: center;">
          <a href="${checkoutUrl}" style="background-color: #107b46; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
            Bestellung jetzt abschließen
          </a>
        </div>
        
        <div style="text-align: center; margin-top: 40px; margin-bottom: 30px; font-size: 13px; color: #475569;">
          <p>Falls Sie Fragen zu Artikeln oder zur Lieferung haben, zögern Sie nicht, uns unter <a href="mailto:${storeEmail}" style="color: #107b46; font-weight: bold; text-decoration: none;">${storeEmail}</a> zu kontaktieren.</p>
        </div>
        
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 11px; color: #94a3b8;">
          <strong style="color: #64748b;">${escapeHtml(storeName)}</strong><br/>
          ${escapeHtml(storeAddress)}
        </div>
      </div>
    `;

    return sendEmail({
      to: userEmail,
      subject: `Ihre Artikel warten noch in Ihrem Warenkorb! 🛒 - ${storeName}`,
      html
    });
  } catch (e) {
    console.error(e);
  }
}

// 5. Review Request Email (Bewertungsanfrage)
export async function sendReviewRequestEmail(order: any, userEmail: string, userName: string, storeUrl: string) {
  try {
    const { logo, storeName, storeAddress } = await getTransporter().catch(() => ({
      logo: '',
      storeName: 'HLG Hausgeräte',
      storeAddress: 'Borseler Chaussee 123, 22453 Hamburg'
    }));
    
    const logoHtml = logo
      ? `<div style="text-align: left; margin-bottom: 25px;"><img src="${logo}" alt="${escapeHtml(storeName)}" style="max-height: 48px;"></div>`
      : `<div style="font-size: 20px; font-weight: bold; color: #107b46; margin-bottom: 25px;">${escapeHtml(storeName)}</div>`;

    const orderId = order.id.slice(-6).toUpperCase();

    let itemsHtml = '';
    if (order.orderItems && order.orderItems.length > 0) {
      itemsHtml = order.orderItems.map((item: any) => {
        let imageUrl = '';
        if (item.product?.images && Array.isArray(item.product.images) && item.product.images.length > 0) {
          imageUrl = typeof item.product.images[0] === 'string' ? item.product.images[0] : item.product.images[0].url;
        } else if (typeof item.product?.images === 'string') {
          try {
            const imgs = JSON.parse(item.product.images);
            if (imgs.length > 0) imageUrl = imgs[0];
          } catch(e) {}
        }
  
        const imgTag = imageUrl
          ? `<img src="${imageUrl}" alt="Artikel" style="width: 50px; height: 50px; object-fit: contain; border-radius: 4px; margin-right: 15px; border: 1px solid #eee;" />`
          : '';
  
        return `
          <tr style="border-bottom: 1px dashed #e2e8f0;">
            <td style="padding: 14px 0;">
              <table style="width: 100%; border: none;">
                <tr>
                  ${imgTag ? `<td style="width: 65px; vertical-align: middle;">${imgTag}</td>` : ''}
                  <td style="vertical-align: middle;">
                    <strong style="font-size: 13px; color: #1e293b;">${escapeHtml(item.product?.title || 'Artikel')}</strong>
                  </td>
                </tr>
              </table>
            </td>
            <td style="padding: 14px 0; text-align: right; vertical-align: middle;">
              <a href="${storeUrl}/produkt/${item.product?.slug || item.product?.id}" style="background-color: #107b46; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 12px; display: inline-block;">
                Jetzt bewerten
              </a>
            </td>
          </tr>
        `;
      }).join('');
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; padding: 25px; background: #ffffff;">
        ${logoHtml}
        <h1 style="font-size: 22px; color: #0f172a; margin-top: 0; margin-bottom: 12px;">
          Wie war Ihre Erfahrung mit HLG Hausgeräte?
        </h1>
        <p style="font-size: 14px; color: #475569;">Hallo ${escapeHtml(userName) || 'geschätzter Kunde'},</p>
        <p style="font-size: 14px; color: #475569;">
          wir hoffen, dass Sie mit Ihren Geräten aus der Bestellung #${orderId} bei <strong>${escapeHtml(storeName)}</strong> rundum zufrieden sind!
        </p>
        <p style="font-size: 14px; color: #475569;">
          Ihre Meinung ist uns sehr wichtig und hilft anderen Kunden bei der Auswahl der besten Haushaltsgeräte für ihr Zuhause.
        </p>
        
        <h3 style="font-size: 15px; font-weight: bold; margin-top: 30px; margin-bottom: 12px; color: #0f172a; border-bottom: 2px solid #107b46; padding-bottom: 6px;">
          Bewerten Sie Ihre Artikel
        </h3>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div style="text-align: center; margin-top: 35px; margin-bottom: 30px; font-size: 13px; color: #475569;">
          <p>Wir danken Ihnen herzlich dafür, dass Sie Ihre Erfahrung mit uns teilen.</p>
        </div>
        
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 11px; color: #94a3b8;">
          <strong style="color: #64748b;">${escapeHtml(storeName)}</strong><br/>
          ${escapeHtml(storeAddress)}
        </div>
      </div>
    `;

    return sendEmail({
      to: userEmail,
      subject: `Wie war Ihre Erfahrung? Bewerten Sie Ihre Bestellung #${orderId} - ${storeName}`,
      html
    });
  } catch (e) {
    console.error(e);
  }
}

// 6. Admin Low Stock Alert (Warnung: Kritischer Lagerbestand)
export async function sendLowStockAlertEmail(
  productTitle: string,
  variationName: string | null,
  currentStock: number,
  threshold: number,
  adminEmail: string,
  storeUrl: string,
  productId: string
) {
  try {
    const { logo, storeName, storeAddress } = await getTransporter().catch(() => ({
      logo: '',
      storeName: 'HLG Hausgeräte',
      storeAddress: 'Borseler Chaussee 123, 22453 Hamburg'
    }));
    
    const logoHtml = logo
      ? `<div style="text-align: left; margin-bottom: 20px;"><img src="${logo}" alt="${escapeHtml(storeName)}" style="max-height: 40px;"></div>`
      : `<div style="font-size: 18px; font-weight: bold; color: #107b46; margin-bottom: 20px;">${escapeHtml(storeName)}</div>`;

    const productName = variationName ? `${productTitle} (${variationName})` : productTitle;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; padding: 25px; background: #ffffff;">
        ${logoHtml}
        <h1 style="font-size: 22px; color: #dc2626; margin-top: 0; margin-bottom: 12px;">⚠️ Warnung: Kritischer Lagerbestand</h1>
        <p style="font-size: 14px; color: #475569;">Hallo Administrator,</p>
        <p style="font-size: 14px; color: #475569;">Der Lagerbestand des folgenden Artikels ist unter die konfigurierte Warngrenze gefallen (${threshold} Stück).</p>
        
        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 0 6px 6px 0;">
          <h3 style="margin-top: 0; color: #991b1b; font-size: 15px;">${escapeHtml(productName)}</h3>
          <p style="margin-bottom: 0; font-size: 15px; color: #1e293b;">
            <strong>Verbleibender Bestand: <span style="color: #dc2626; font-size: 18px;">${currentStock}</span> Stück</strong>
          </p>
        </div>
        
        <p style="margin-top: 30px; text-align: center; margin-bottom: 30px;">
          <a href="${storeUrl}/admin/products/${productId}/edit" style="background-color: #107b46; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">
            Bestand im Admin-Dashboard bearbeiten
          </a>
        </p>
        
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 11px; color: #94a3b8;">
          <strong style="color: #64748b;">${escapeHtml(storeName)}</strong><br/>
          ${escapeHtml(storeAddress)}
        </div>
      </div>
    `;

    return sendEmail({
      to: adminEmail,
      subject: `⚠️ [Niedriger Lagerbestand] ${productName} - Nur noch ${currentStock} Stück verfügbar`,
      html
    });
  } catch (e) {
    console.error(e);
  }
}

// 7. Admin New Chat Message Notification (Nachricht im Kundenservice-Chat)
export async function sendAdminNewChatMessageEmail(
  guestName: string,
  guestEmail: string | null,
  messageContent: string,
  adminEmail: string,
  storeUrl: string
) {
  try {
    const { logo, storeName, storeAddress } = await getTransporter().catch(() => ({
      logo: '',
      storeName: 'HLG Hausgeräte',
      storeAddress: 'Borseler Chaussee 123, 22453 Hamburg'
    }));
    
    const logoHtml = logo
      ? `<div style="text-align: left; margin-bottom: 20px;"><img src="${logo}" alt="${escapeHtml(storeName)}" style="max-height: 40px;"></div>`
      : `<div style="font-size: 18px; font-weight: bold; color: #107b46; margin-bottom: 20px;">${escapeHtml(storeName)}</div>`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; padding: 25px; background: #ffffff;">
        ${logoHtml}
        <h1 style="font-size: 22px; color: #0f172a; margin-top: 0; margin-bottom: 12px;">💬 Neue Nachricht im Kundenservice-Chat</h1>
        <p style="font-size: 14px; color: #475569;">Ein Besucher hat eine Nachricht über den Live-Chat Ihres Online-Shops hinterlassen.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <tr>
            <td style="padding: 12px; font-size: 13px; font-weight: bold; width: 100px; color: #64748b;">Von:</td>
            <td style="padding: 12px; font-size: 13px; color: #0f172a;">
              <strong>${escapeHtml(guestName) || "Besucher"}</strong>
              ${guestEmail ? ` &lt;<a href="mailto:${guestEmail}" style="color: #2563eb;">${escapeHtml(guestEmail)}</a>&gt;` : ""}
            </td>
          </tr>
          <tr style="border-top: 1px solid #e2e8f0;">
            <td style="padding: 12px; vertical-align: top; font-size: 13px; font-weight: bold; color: #64748b;">Nachricht:</td>
            <td style="padding: 12px; font-size: 13px; color: #1e293b; font-style: italic; line-height: 1.5;">
              "${escapeHtml(messageContent)}"
            </td>
          </tr>
        </table>
        
        <p style="margin-top: 30px; text-align: center; margin-bottom: 30px;">
          <a href="${storeUrl}/admin/chat" style="background-color: #107b46; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">
            Im Admin-Chat antworten
          </a>
        </p>
        
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 11px; color: #94a3b8;">
          <strong style="color: #64748b;">${escapeHtml(storeName)}</strong><br/>
          ${escapeHtml(storeAddress)}
        </div>
      </div>
    `;

    const replyTo = guestEmail
      ? (guestName ? `"${guestName}" <${guestEmail}>` : guestEmail)
      : undefined;

    return sendEmail({
      to: adminEmail,
      replyTo,
      subject: `💬 [Kundenservice Chat] Neue Nachricht von ${escapeHtml(guestName) || "Besucher"}`,
      html
    });
  } catch (e) {
    console.error(e);
  }
}

// 8. Newsletter Welcome Email for Client (Willkommen Newsletter mit 25 € Gutschein)
export async function sendNewsletterWelcomeEmail(userEmail: string) {
  try {
    const { logo, storeName, storeEmail, storeAddress } = await getTransporter().catch(() => ({
      logo: '',
      storeName: 'HLG Hausgeräte',
      storeEmail: 'info@hlg-hausgeraete.de',
      storeAddress: 'Borseler Chaussee 123, 22453 Hamburg'
    }));
    
    const logoHtml = logo
      ? `<div style="text-align: left; margin-bottom: 25px;"><img src="${logo}" alt="${escapeHtml(storeName)}" style="max-height: 48px;"></div>`
      : `<div style="font-size: 20px; font-weight: bold; color: #107b46; margin-bottom: 25px;">${escapeHtml(storeName)}</div>`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; padding: 25px; background: #ffffff;">
        ${logoHtml}
        <h1 style="font-size: 22px; color: #0f172a; margin-top: 0; margin-bottom: 12px;">
          🎁 Willkommen bei HLG Hausgeräte! Ihr 15 € Willkommens-Gutschein
        </h1>
        
        <p style="font-size: 14px; color: #475569; margin-bottom: 16px;">
          Wir freuen uns sehr, Sie in unserem Newsletter begrüßen zu dürfen! 🌿
        </p>
        <p style="font-size: 14px; color: #475569; margin-bottom: 25px;">
          Als Willkommensgeschenk erhalten Sie <strong>15 € Sofortrabatt</strong> auf Ihre nächste Bestellung hochwertiger Haushaltsgeräte in unserem Shop!
        </p>
        
        <div style="background-color: #f0fdf4; border: 2px dashed #107b46; padding: 22px; text-align: center; border-radius: 8px; margin-bottom: 25px;">
          <p style="margin: 0; font-size: 13px; color: #15803d; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">
            Ihr persönlicher Gutscheincode:
          </p>
          <p style="margin: 10px 0 0 0; font-size: 26px; font-weight: 800; color: #107b46; letter-spacing: 3px; font-family: monospace;">
            WELCOME15
          </p>
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #15803d;">
            Einfach beim Bestellvorgang eingeben
          </p>
        </div>
        
        <p style="font-size: 13px; color: #64748b; margin-bottom: 25px; text-align: center;">
          Geben Sie den Code einfach an der Kasse ein — kein Mindestbestellwert! 🛒
        </p>
        
        <h3 style="font-size: 15px; font-weight: bold; margin-bottom: 12px; color: #0f172a; border-bottom: 2px solid #107b46; padding-bottom: 6px;">
          Ihre exklusiven HLG Hausgeräte Vorteile:
        </h3>
        <ul style="font-size: 13px; color: #475569; padding-left: 20px; margin-bottom: 25px; line-height: 1.8;">
          <li>✨ Exklusive Rabatte und Vorabzugang zu Sonderaktionen</li>
          <li>⚡ 2 Jahre Garantie auf alle Großgeräte</li>
          <li>📦 Schneller und versicherter Versand direkt nach Hause</li>
        </ul>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="https://hlghausgeraete.de/shop" style="background-color: #107b46; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
            Produkte im Shop ansehen
          </a>
        </div>
        
        <div style="text-align: center; margin-top: 35px; margin-bottom: 25px; font-size: 13px; color: #475569;">
          <p style="font-weight: bold; color: #107b46; margin-bottom: 4px;">HLG Hausgeräte Kundenservice</p>
          <p style="margin-top: 0; font-size: 12px; color: #64748b;">Kontakt: ${storeEmail}</p>
        </div>
        
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 11px; color: #94a3b8;">
          <strong style="color: #64748b;">${escapeHtml(storeName)}</strong><br/>
          ${escapeHtml(storeAddress)}
        </div>
      </div>
    `;

    return sendEmail({
      to: userEmail,
      subject: `Willkommen bei HLG Hausgeräte! Ihr 25 € Gutschein 🎁`,
      html
    });
  } catch (e) {
    console.error(e);
  }
}

// 9. Supervision Live Admin Alert Email
export async function sendAdminAlertEmail({
  title,
  message,
  details,
}: {
  title: string;
  message: string;
  details?: Record<string, any>;
}) {
  try {
    const settingsDb = await prisma.setting.findMany({
      where: { key: { in: ['CONTACT_RECEIVER_EMAIL', 'SMTP_USER'] } }
    });
    const sMap = settingsDb.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);
    const recipient = sMap['CONTACT_RECEIVER_EMAIL'] || sMap['SMTP_USER'] || 'info@hlg-hausgeraete.de';

    let detailsHtml = '';
    if (details && Object.keys(details).length > 0) {
      detailsHtml = `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin-top: 15px;">
          <table style="width: 100%; font-size: 13px; color: #334155;">
            ${Object.entries(details).map(([k, v]) => `
              <tr>
                <td style="padding: 4px 8px; font-weight: bold; width: 140px; vertical-align: top;">${escapeHtml(k)}:</td>
                <td style="padding: 4px 8px; font-family: monospace;">${escapeHtml(typeof v === 'object' ? JSON.stringify(v) : String(v))}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      `;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
        <div style="background-color: #ef4444; color: white; padding: 12px 20px; border-radius: 6px 6px 0 0; font-size: 16px; font-weight: bold;">
          ⚠️ Live-Überwachung des Shops : ${escapeHtml(title)}
        </div>
        <div style="border: 1px solid #e2e8f0; border-top: none; padding: 20px; border-radius: 0 0 6px 6px; background: white;">
          <p style="font-size: 14px; line-height: 1.6; margin-top: 0;">${escapeHtml(message)}</p>
          ${detailsHtml}
          <p style="font-size: 12px; color: #64748b; margin-top: 25px; border-top: 1px solid #f1f5f9; padding-top: 10px;">
            Automatische Warnung des Shop-Überwachungssystems.
          </p>
        </div>
      </div>
    `;

    return sendEmail({
      to: recipient,
      subject: `🚨 [Shop-Alarm] ${title}`,
      html,
    });
  } catch (err) {
    console.error('Fehler beim Senden der Administrator-Warnung:', err);
  }
}
