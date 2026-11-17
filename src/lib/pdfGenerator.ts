/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import PDFDocument from 'pdfkit';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

// Format currency according to German locale (de-DE)
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(price);
};

// Format date in German (de-DE)
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'long' }).format(date);
};

const formatPaymentMethod = (method: string) => {
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

export async function generateInvoicePDF(order: any): Promise<Buffer> {
  let logoBuffer: Buffer | null = null;
  let storeName = 'HLG Hausgeräte';
  const companyName = 'HLG Hausgeräte GmbH';
  let companyAddress = 'Borseler Chaussee 123, 22453 Hamburg, Deutschland';
  let companyEmail = 'info@hlg-hausgeraete.de';
  
  // Robust local logo detection (HLG Hausgeräte logo located in workspace root and public folder)
  const candidatePaths = [
    path.join(process.cwd(), 'LOGO-HLG-HAUSGERAETE.png'),
    path.join(process.cwd(), 'public', 'LOGO-HLG-HAUSGERAETE.png'),
    path.join(process.cwd(), 'public', 'logo.png'),
    path.join(process.cwd(), 'public', 'logo.jpg')
  ];
  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p)) {
        logoBuffer = fs.readFileSync(p);
        break;
      }
    } catch {}
  }

  try {
    const settingsDb = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'HEADER_LOGO_IMAGE',
            'STYLE2_LOGO',
            'STORE_NAME',
            'NEXT_PUBLIC_STORE_NAME',
            'CONTACT_ADDRESS',
            'FOOTER_ADDRESS_1',
            'CONTACT_EMAIL_DISPLAY',
            'FOOTER_SUPPORT_EMAIL'
          ]
        }
      }
    });
    const sMap = settingsDb.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);
    
    if (sMap.STORE_NAME) storeName = sMap.STORE_NAME;
    else if (sMap.NEXT_PUBLIC_STORE_NAME) storeName = sMap.NEXT_PUBLIC_STORE_NAME;

    if (sMap.CONTACT_ADDRESS) companyAddress = sMap.CONTACT_ADDRESS;
    else if (sMap.FOOTER_ADDRESS_1) companyAddress = sMap.FOOTER_ADDRESS_1;

    if (sMap.CONTACT_EMAIL_DISPLAY) companyEmail = sMap.CONTACT_EMAIL_DISPLAY;
    else if (sMap.FOOTER_SUPPORT_EMAIL) companyEmail = sMap.FOOTER_SUPPORT_EMAIL;

    // Remote logo attempt only if local logo was not found
    if (!logoBuffer) {
      const logoSetting = sMap['HEADER_LOGO_IMAGE'] || sMap['STYLE2_LOGO'];
      if (logoSetting && /^https?:\/\//i.test(logoSetting)) {
        try {
          const res = await fetch(logoSetting);
          if (res.ok) {
            const ab = await res.arrayBuffer();
            logoBuffer = Buffer.from(ab);
          }
        } catch (err) {
          console.warn('Failed to fetch remote logo for PDF invoice:', err);
        }
      }
    }
  } catch (e) {
    // ignore
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Customer details extraction
      let customerName = 'Kunde';
      let customerEmail = order.user?.email || '';
      let customerPhone = '';
      let customerNif = '';
      let customerAddress = '';
      let shippingCost = 0;
      let shippingMethodName = '';

      if (order.destinationAddress) {
        try {
          const metadata = typeof order.destinationAddress === 'string'
            ? JSON.parse(order.destinationAddress)
            : order.destinationAddress;

          const billing = metadata?.billing || metadata?.shipping;
          if (billing) {
            customerName = `${billing.firstName || ''} ${billing.lastName || ''}`.trim() || customerName;
            customerEmail = billing.email || customerEmail;
            customerPhone = billing.phone || '';
            customerNif = billing.nif || billing.taxId || metadata?.nif || '';
            const street = [billing.address1, billing.address2, billing.address].filter(Boolean).join(', ');
            const cityPostal = [billing.postalCode, billing.zipCode, billing.city].filter(Boolean).join(' ');
            customerAddress = [street, cityPostal, billing.country].filter(Boolean).join('\n').trim();
          }

          if (typeof metadata?.shippingCost === 'number') {
            shippingCost = metadata.shippingCost;
          }
          if (metadata?.shippingMethodName) {
            shippingMethodName = metadata.shippingMethodName;
          }
        } catch (e) {
          // ignore
        }
      }

      // Render document parts
      generateHeader(doc, logoBuffer, storeName, companyName, companyAddress, companyEmail);
      generateCustomerInformation(
        doc,
        order,
        customerName,
        customerEmail,
        customerPhone,
        customerNif,
        customerAddress
      );
      generateInvoiceTable(doc, order, shippingCost, shippingMethodName);
      generateFooter(doc, companyEmail);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function generateHeader(
  doc: typeof PDFDocument,
  logoBuffer: Buffer | null,
  storeName: string,
  companyName: string,
  companyAddress: string,
  companyEmail: string
) {
  const headerTop = 45;

  if (logoBuffer) {
    try {
      doc.image(logoBuffer, 50, headerTop, { fit: [150, 48] });
    } catch (e) {
      doc
        .fillColor('#107b46')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text(storeName, 50, headerTop + 10);
    }
  } else {
    doc
      .fillColor('#107b46')
      .fontSize(18)
      .font('Helvetica-Bold')
      .text(storeName, 50, headerTop + 10);
  }

  doc
    .fillColor('#1e293b')
    .font('Helvetica-Bold')
    .fontSize(22)
    .text('RECHNUNG', 200, headerTop, { align: 'right' })
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor('#334155')
    .text(companyName, 200, headerTop + 26, { align: 'right' })
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor('#64748b')
    .text(companyAddress, 200, headerTop + 38, { align: 'right' })
    .text(`E-Mail: ${companyEmail} | hlghausgeraete.de`, 200, headerTop + 50, { align: 'right' })
    .moveDown();
}

function generateCustomerInformation(
  doc: typeof PDFDocument,
  order: any,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  customerNif: string,
  customerAddress: string
) {
  doc
    .fillColor('#1e293b')
    .font('Helvetica-Bold')
    .fontSize(14)
    .text('Bestell- & Rechnungsdaten', 50, 130);

  generateHr(doc, 148);

  const customerInformationTop = 160;

  const orderStatusLabel =
    order.status === 'PAID'
      ? 'Bezahlt'
      : order.status === 'SHIPPED'
        ? 'Versendet'
        : order.status === 'DELIVERED'
          ? 'Zugestellt'
          : order.status === 'PROCESSING'
            ? 'In Bearbeitung'
            : order.status === 'CANCELLED'
              ? 'Storniert'
              : 'Ausstehend';

  // Left Column: Order details
  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#64748b')
    .text('Rechnung Nr.:', 50, customerInformationTop)
    .font('Helvetica-Bold')
    .fillColor('#1e293b')
    .text(`HLG-${order.id.slice(-6).toUpperCase()}`, 150, customerInformationTop)

    .font('Helvetica')
    .fillColor('#64748b')
    .text('Rechnungsdatum:', 50, customerInformationTop + 15)
    .font('Helvetica')
    .fillColor('#1e293b')
    .text(formatDate(new Date(order.createdAt)), 150, customerInformationTop + 15)

    .font('Helvetica')
    .fillColor('#64748b')
    .text('Zahlungsmethode:', 50, customerInformationTop + 30)
    .font('Helvetica-Bold')
    .fillColor('#107b46')
    .text(formatPaymentMethod(order.paymentMethod), 150, customerInformationTop + 30)

    .font('Helvetica')
    .fillColor('#64748b')
    .text('Bestellstatus:', 50, customerInformationTop + 45)
    .font('Helvetica')
    .fillColor('#1e293b')
    .text(orderStatusLabel, 150, customerInformationTop + 45);

  // Right Column: Client details
  doc
    .font('Helvetica-Bold')
    .fillColor('#64748b')
    .fontSize(9)
    .text('Rechnung an:', 320, customerInformationTop)
    .font('Helvetica-Bold')
    .fillColor('#1e293b')
    .fontSize(10)
    .text(customerName, 320, customerInformationTop + 13)
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#334155');

  let currentY = customerInformationTop + 27;

  if (customerNif) {
    doc.text(`USt-IdNr.: ${customerNif}`, 320, currentY);
    currentY += 13;
  }

  if (customerEmail) {
    doc.text(`E-Mail: ${customerEmail}`, 320, currentY);
    currentY += 13;
  }

  if (customerPhone) {
    doc.text(`Telefon: ${customerPhone}`, 320, currentY);
    currentY += 13;
  }

  if (customerAddress) {
    doc.text(customerAddress.replace(/\n/g, ', '), 320, currentY, { width: 230 });
  }

  generateHr(doc, 240);
}

function generateInvoiceTable(
  doc: typeof PDFDocument,
  order: any,
  shippingCost: number,
  shippingMethodName: string
) {
  const invoiceTableTop = 265;

  doc.font('Helvetica-Bold').fontSize(9).fillColor('#1e293b');
  generateTableRow(
    doc,
    invoiceTableTop,
    'Artikel / Beschreibung',
    'Menge',
    'Einzelpreis',
    'Gesamt'
  );
  generateHr(doc, invoiceTableTop + 18);
  doc.font('Helvetica').fontSize(9).fillColor('#334155');

  let position = invoiceTableTop + 26;
  
  if (order.orderItems && order.orderItems.length > 0) {
    for (let i = 0; i < order.orderItems.length; i++) {
      const item = order.orderItems[i];
      const title = item.product?.title || 'Artikel';
      const quantity = item.quantity;
      const price = item.price;
      const lineTotal = quantity * price;

      generateTableRow(
        doc,
        position,
        title.length > 48 ? title.substring(0, 48) + '...' : title,
        quantity.toString(),
        formatPrice(price),
        formatPrice(lineTotal)
      );

      generateHr(doc, position + 18);
      position += 26;
    }
  }

  // Calculate totals & tax
  const subTotal = order.orderItems?.reduce((sum: number, it: any) => sum + (it.price * it.quantity), 0) || order.total;
  let shippingLabel = formatPrice(shippingCost);
  if (shippingCost === 0) {
    if (shippingMethodName && !shippingMethodName.toLowerCase().includes('kostenlos')) {
      shippingLabel = `Kostenlos (${shippingMethodName})`;
    } else {
      shippingLabel = 'Kostenlos';
    }
  }

  // MwSt (19% standard in Germany)
  const mwstRate = 0.19;
  const baseLiquida = order.total / (1 + mwstRate);
  const valorMwst = order.total - baseLiquida;

  let totalsY = position + 15;

  doc.font('Helvetica').fontSize(9).fillColor('#64748b');
  doc.text('Zwischensumme:', 340, totalsY, { width: 100, align: 'right' });
  doc.font('Helvetica').fillColor('#1e293b').text(formatPrice(subTotal), 450, totalsY, { width: 100, align: 'right' });

  totalsY += 16;
  doc.font('Helvetica').fillColor('#64748b').text('Versandkosten:', 340, totalsY, { width: 100, align: 'right' });
  doc.font('Helvetica').fillColor('#1e293b').text(shippingLabel, 450, totalsY, { width: 100, align: 'right' });

  totalsY += 16;
  doc.font('Helvetica').fillColor('#64748b').text('Inkl. 19% MwSt.:', 340, totalsY, { width: 100, align: 'right' });
  doc.font('Helvetica').fillColor('#1e293b').text(formatPrice(valorMwst), 450, totalsY, { width: 100, align: 'right' });

  totalsY += 20;
  generateHr(doc, totalsY - 4);
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#107b46');
  doc.text('Gesamtbetrag:', 320, totalsY, { width: 120, align: 'right' });
  doc.text(formatPrice(order.total), 450, totalsY, { width: 100, align: 'right' });
  doc.font('Helvetica');
}

function generateFooter(doc: typeof PDFDocument, companyEmail: string) {
  doc
    .fontSize(9)
    .font('Helvetica-Bold')
    .fillColor('#1e293b')
    .text(
      'Vielen Dank für Ihren Einkauf und Ihr Vertrauen in HLG Hausgeräte!',
      50,
      695,
      { align: 'center', width: 500 }
    )
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#64748b')
    .text(
      `Bei Fragen oder für den Kundenservice erreichen Sie uns jederzeit unter ${companyEmail}.`,
      50,
      710,
      { align: 'center', width: 500 }
    )
    .text(
      'Diese Rechnung wurde elektronisch erstellt und ist ohne Unterschrift gültig.',
      50,
      722,
      { align: 'center', width: 500 }
    );
}

function generateTableRow(
  doc: typeof PDFDocument,
  y: number,
  item: string,
  quantity: string,
  unitCost: string,
  lineTotal: string
) {
  doc
    .text(item, 50, y, { width: 280 })
    .text(quantity, 335, y, { width: 45, align: 'right' })
    .text(unitCost, 385, y, { width: 75, align: 'right' })
    .text(lineTotal, 465, y, { width: 85, align: 'right' });
}

function generateHr(doc: typeof PDFDocument, y: number) {
  doc
    .strokeColor('#e2e8f0')
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(550, y)
    .stroke();
}
