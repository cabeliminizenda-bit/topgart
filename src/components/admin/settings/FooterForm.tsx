'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateSettingsBatch } from '@/actions/settings';

interface FooterLink {
  label: string;
  url: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

const DEFAULT_FOUR_COLUMNS: FooterColumn[] = [
  {
    title: 'Rechtliches',
    links: [
      { label: 'AGB', url: '/agb' },
      { label: 'Impressum', url: '/impressum' },
      { label: 'Über uns', url: '/ueber-uns' },
      { label: 'Datenschutzrichtlinie', url: '/datenschutz' },
      { label: 'Kontakt', url: '/kontakt' },
    ],
  },
  {
    title: 'Schnelle Links',
    links: [
      { label: 'Versandpolitik', url: '/lieferzeiten' },
      { label: 'Rückgabe & Rückerstattung', url: '/rueckgabe-und-erstattung' },
      { label: 'Zahlungsart', url: '/zahlungsinformationen' },
      { label: 'Cookie-Richtlinie', url: '/cookie-richtlinie' },
      { label: 'Widerrufsbelehrung', url: '/widerrufsbelehrung' },
    ],
  },
  {
    title: 'Kunden',
    links: [
      { label: 'Warenkorb', url: '/cart' },
      { label: 'Checkout', url: '/checkout' },
      { label: 'Wunschliste', url: '/wishlist' },
    ],
  },
  {
    title: 'Katalog',
    links: [
      { label: 'Akku-Rasenmäher', url: '/shop?category=akku-rasenmaeher' },
      { label: 'Benzin-Rasenmäher', url: '/shop?category=benzin-rasenmaeher' },
      { label: 'Rasentraktoren', url: '/shop?category=rasentraktoren' },
      { label: 'Mähroboter', url: '/shop?category=maehroboter' },
      { label: 'Kettensäge & Rasentrimmer', url: '/shop?category=kettensaege-rasentrimmer' },
    ],
  },
];

export default function FooterForm({ initialSettings }: { initialSettings: Record<string, string> }) {
  const tSettings = useTranslations('AdminSettings');
  const router = useRouter();

  // Colors
  const [footerBgColor, setFooterBgColor] = useState(
    initialSettings.FOOTER_BG_COLOR && initialSettings.FOOTER_BG_COLOR !== '#0B162C' && initialSettings.FOOTER_BG_COLOR !== '#0f172a'
      ? initialSettings.FOOTER_BG_COLOR
      : '#ffffff'
  );
  const [footerTextColor, setFooterTextColor] = useState(
    initialSettings.FOOTER_TEXT_COLOR && initialSettings.FOOTER_TEXT_COLOR !== '#d1d5db'
      ? initialSettings.FOOTER_TEXT_COLOR
      : '#444444'
  );
  const [footerHeadingColor, setFooterHeadingColor] = useState(
    initialSettings.FOOTER_HEADING_COLOR && initialSettings.FOOTER_HEADING_COLOR !== '#ffffff'
      ? initialSettings.FOOTER_HEADING_COLOR
      : '#e05246'
  );

  // Columns & Links
  const [footerColumns, setFooterColumns] = useState<FooterColumn[]>(() => {
    try {
      if (initialSettings.FOOTER_COLUMNS) {
        const parsed = JSON.parse(initialSettings.FOOTER_COLUMNS);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const isOld = parsed.length === 2 && parsed[0]?.title === 'Kundenservice' && parsed[1]?.title === 'Mein Konto';
          if (!isOld) {
            return parsed;
          }
        }
      }
    } catch {}
    return DEFAULT_FOUR_COLUMNS;
  });

  // Contact Column (Column 5)
  const [footerContactTitle, setFooterContactTitle] = useState(initialSettings.FOOTER_CONTACT_TITLE || 'Kontaktinformationen');
  const [footerShowAddress, setFooterShowAddress] = useState(initialSettings.FOOTER_SHOW_ADDRESS !== 'false');
  const [footerAddress, setFooterAddress] = useState(initialSettings.FOOTER_ADDRESS_1 ?? 'Rosenstraße 19, 26529 Marienhafe, Deutschland');
  const [footerShowEmail, setFooterShowEmail] = useState(initialSettings.FOOTER_SHOW_EMAIL !== 'false');
  const [footerSupportEmail, setFooterSupportEmail] = useState(initialSettings.FOOTER_SUPPORT_EMAIL ?? initialSettings.HEADER_SUPPORT_EMAIL ?? 'kontakt@topgartengeraete.de');
  const [footerShowPhone, setFooterShowPhone] = useState(initialSettings.FOOTER_SHOW_PHONE === 'true');
  const [footerSupportPhone, setFooterSupportPhone] = useState(initialSettings.FOOTER_SUPPORT_PHONE ?? initialSettings.HEADER_SUPPORT_PHONE ?? '');
  const [footerBadgeText, setFooterBadgeText] = useState(initialSettings.FOOTER_BADGE_TEXT || 'Geprüfte Fachhändler-Qualität');

  // Categories Horizontal Strip
  const [footerShowCategoriesStrip, setFooterShowCategoriesStrip] = useState(initialSettings.FOOTER_SHOW_CATEGORIES_STRIP !== 'false');
  const [footerCategoriesTitle, setFooterCategoriesTitle] = useState(initialSettings.FOOTER_CATEGORIES_TITLE || 'Kategorien :');

  // Bottom Copyright & Payment Badges
  const [footerCopyright, setFooterCopyright] = useState(
    initialSettings.FOOTER_COPYRIGHT && !initialSettings.FOOTER_COPYRIGHT.includes('HLG')
      ? initialSettings.FOOTER_COPYRIGHT
      : '© 2026 TOP GARTENGERÄTE'
  );
  const [footerPaymentVisa, setFooterPaymentVisa] = useState(initialSettings.FOOTER_PAYMENT_VISA !== 'false');
  const [footerPaymentCb, setFooterPaymentCb] = useState(initialSettings.FOOTER_PAYMENT_CB !== 'false');
  const [footerPaymentAmex, setFooterPaymentAmex] = useState(initialSettings.FOOTER_PAYMENT_AMEX !== 'false');
  const [footerPaymentMaestro, setFooterPaymentMaestro] = useState(initialSettings.FOOTER_PAYMENT_MAESTRO !== 'false');
  const [footerPaymentMastercard, setFooterPaymentMastercard] = useState(initialSettings.FOOTER_PAYMENT_MASTERCARD !== 'false');
  const [footerPaymentPaypal, setFooterPaymentPaypal] = useState(initialSettings.FOOTER_PAYMENT_PAYPAL !== 'false');
  const [footerPaymentApplePay, setFooterPaymentApplePay] = useState(initialSettings.FOOTER_PAYMENT_APPLE_PAY === 'true');
  const [footerPaymentGooglePay, setFooterPaymentGooglePay] = useState(initialSettings.FOOTER_PAYMENT_GOOGLE_PAY === 'true');

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleResetColors = () => {
    setFooterBgColor('#ffffff');
    setFooterTextColor('#444444');
    setFooterHeadingColor('#e05246');
  };

  const handleResetColumns = () => {
    if (confirm('Möchten Sie die Fußzeilen-Spalten auf das empfohlene 4-Spalten-Standardlayout zurücksetzen?')) {
      setFooterColumns(DEFAULT_FOUR_COLUMNS);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      await updateSettingsBatch({
        FOOTER_BG_COLOR: footerBgColor,
        FOOTER_TEXT_COLOR: footerTextColor,
        FOOTER_HEADING_COLOR: footerHeadingColor,
        FOOTER_COLUMNS: JSON.stringify(footerColumns),
        FOOTER_CONTACT_TITLE: footerContactTitle,
        FOOTER_SHOW_ADDRESS: footerShowAddress.toString(),
        FOOTER_ADDRESS_1: footerAddress,
        FOOTER_SHOW_EMAIL: footerShowEmail.toString(),
        FOOTER_SUPPORT_EMAIL: footerSupportEmail,
        FOOTER_SHOW_PHONE: footerShowPhone.toString(),
        FOOTER_SUPPORT_PHONE: footerSupportPhone,
        FOOTER_BADGE_TEXT: footerBadgeText,
        FOOTER_SHOW_CATEGORIES_STRIP: footerShowCategoriesStrip.toString(),
        FOOTER_CATEGORIES_TITLE: footerCategoriesTitle,
        FOOTER_COPYRIGHT: footerCopyright,
        FOOTER_PAYMENT_VISA: footerPaymentVisa.toString(),
        FOOTER_PAYMENT_CB: footerPaymentCb.toString(),
        FOOTER_PAYMENT_AMEX: footerPaymentAmex.toString(),
        FOOTER_PAYMENT_MAESTRO: footerPaymentMaestro.toString(),
        FOOTER_PAYMENT_MASTERCARD: footerPaymentMastercard.toString(),
        FOOTER_PAYMENT_PAYPAL: footerPaymentPaypal.toString(),
        FOOTER_PAYMENT_APPLE_PAY: footerPaymentApplePay.toString(),
        FOOTER_PAYMENT_GOOGLE_PAY: footerPaymentGooglePay.toString(),
      });

      setMessage('Die Fußzeilen-Einstellungen wurden erfolgreich gespeichert.');
      router.refresh();
    } catch {
      setMessage('Fehler beim Speichern der Fußzeile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fußzeile (Footer) verwalten</h2>
          <p className="text-sm text-gray-500 mt-1">
            Passen Sie Farben, Navigationsspalten, Kontaktangaben und Zahlungsarten der Fußzeile an.
          </p>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-[#00a86b] text-white rounded-lg hover:bg-[#008f5b] disabled:bg-gray-400 text-sm font-semibold shadow-sm transition-colors"
        >
          {isLoading ? 'Speichern...' : 'Änderungen speichern'}
        </button>
      </div>

      {message && (
        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-lg border border-emerald-200 flex items-center gap-3">
          <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-medium">{message}</span>
        </div>
      )}

      {/* 1. Design & Farben */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <span>🎨</span> Farben & Erscheinungsbild
          </h3>
          <button
            type="button"
            onClick={handleResetColors}
            className="text-xs text-stone-500 hover:text-stone-800 underline"
          >
            Auf Standardfarben zurücksetzen
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 bg-stone-50 p-4 rounded-lg border border-stone-200">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Hintergrundfarbe</label>
            <div className="flex items-center gap-2.5">
              <div className="relative w-10 h-10 shrink-0">
                <input
                  type="color"
                  value={footerBgColor}
                  onChange={(e) => setFooterBgColor(e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
                <div className="w-10 h-10 rounded-lg shadow-xs border border-gray-300" style={{ backgroundColor: footerBgColor }} />
              </div>
              <input
                type="text"
                value={footerBgColor}
                onChange={(e) => setFooterBgColor(e.target.value)}
                className="w-28 px-2.5 py-1.5 border border-gray-300 rounded-md text-xs font-mono uppercase bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Textfarbe</label>
            <div className="flex items-center gap-2.5">
              <div className="relative w-10 h-10 shrink-0">
                <input
                  type="color"
                  value={footerTextColor}
                  onChange={(e) => setFooterTextColor(e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
                <div className="w-10 h-10 rounded-lg shadow-xs border border-gray-300" style={{ backgroundColor: footerTextColor }} />
              </div>
              <input
                type="text"
                value={footerTextColor}
                onChange={(e) => setFooterTextColor(e.target.value)}
                className="w-28 px-2.5 py-1.5 border border-gray-300 rounded-md text-xs font-mono uppercase bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Überschriftenfarbe (Titel)</label>
            <div className="flex items-center gap-2.5">
              <div className="relative w-10 h-10 shrink-0">
                <input
                  type="color"
                  value={footerHeadingColor}
                  onChange={(e) => setFooterHeadingColor(e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
                <div className="w-10 h-10 rounded-lg shadow-xs border border-gray-300" style={{ backgroundColor: footerHeadingColor }} />
              </div>
              <input
                type="text"
                value={footerHeadingColor}
                onChange={(e) => setFooterHeadingColor(e.target.value)}
                className="w-28 px-2.5 py-1.5 border border-gray-300 rounded-md text-xs font-mono uppercase bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Spalten & Navigations-Links */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <span>📋</span> Navigationsspalten & Links
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Fügen Sie Spalten hinzu, benennen Sie diese um oder bearbeiten Sie die enthaltenen Links.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetColumns}
              className="text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-md border border-stone-200 transition-colors"
            >
              Standard 4 Spalten laden
            </button>
            <button
              type="button"
              onClick={() => setFooterColumns([...footerColumns, { title: 'Neue Spalte', links: [] }])}
              className="text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-md border border-emerald-200 flex items-center gap-1 transition-colors"
            >
              + Spalte hinzufügen
            </button>
          </div>
        </div>

        <div className="space-y-5">
          {footerColumns.map((col, colIdx) => (
            <div key={colIdx} className="bg-white border border-stone-200 rounded-lg p-4 shadow-2xs">
              <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Spalte {colIdx + 1}:</span>
                  <input
                    type="text"
                    value={col.title}
                    onChange={(e) => {
                      const updated = [...footerColumns];
                      updated[colIdx].title = e.target.value;
                      setFooterColumns(updated);
                    }}
                    placeholder="Spaltentitel (z.B. Rechtliches)"
                    className="font-semibold text-sm px-3 py-1.5 border border-stone-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 max-w-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setFooterColumns(footerColumns.filter((_, i) => i !== colIdx))}
                  className="text-xs text-red-600 hover:bg-red-50 px-2.5 py-1 rounded border border-red-200 font-medium transition-colors"
                >
                  Spalte löschen
                </button>
              </div>

              {/* Links list */}
              <div className="space-y-2 pl-2 sm:pl-4 border-l-2 border-emerald-100">
                {col.links.map((link, linkIdx) => (
                  <div key={linkIdx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Link-Text (z.B. Impressum)"
                      value={link.label}
                      onChange={(e) => {
                        const updated = [...footerColumns];
                        updated[colIdx].links[linkIdx].label = e.target.value;
                        setFooterColumns(updated);
                      }}
                      className="flex-1 px-3 py-1.5 border border-stone-300 rounded-md text-xs focus:ring-1 focus:ring-emerald-500"
                    />
                    <input
                      type="text"
                      placeholder="Ziel-URL (z.B. /impressum)"
                      value={link.url}
                      onChange={(e) => {
                        const updated = [...footerColumns];
                        updated[colIdx].links[linkIdx].url = e.target.value;
                        setFooterColumns(updated);
                      }}
                      className="flex-1 px-3 py-1.5 border border-stone-300 rounded-md text-xs focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...footerColumns];
                        updated[colIdx].links = updated[colIdx].links.filter((_, i) => i !== linkIdx);
                        setFooterColumns(updated);
                      }}
                      className="text-stone-400 hover:text-red-600 p-1.5 rounded"
                      title="Link entfernen"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    const updated = [...footerColumns];
                    updated[colIdx].links.push({ label: '', url: '' });
                    setFooterColumns(updated);
                  }}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-medium hover:underline inline-flex items-center gap-1 pt-1"
                >
                  + Neuer Link in «{col.title || 'dieser Spalte'}»
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Kontaktinformationen (Spalte 5) */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <div>
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <span>📍</span> Kontaktinformationen (Rechte Spalte)
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Verwalten Sie die im Footer angezeigten Kontaktdaten und das Qualitätssiegel.
          </p>
        </div>

        <div className="bg-stone-50 p-5 rounded-lg border border-stone-200 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Spaltentitel</label>
            <input
              type="text"
              value={footerContactTitle}
              onChange={(e) => setFooterContactTitle(e.target.value)}
              placeholder="Kontaktinformationen"
              className="w-full sm:w-80 px-3 py-1.5 border border-stone-300 rounded-md text-sm bg-white"
            />
          </div>

          {/* Adresse */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
            <div className="flex items-center gap-2 min-w-[150px]">
              <input
                type="checkbox"
                id="footerShowAddress"
                checked={footerShowAddress}
                onChange={(e) => setFooterShowAddress(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
              />
              <label htmlFor="footerShowAddress" className="text-xs font-medium text-gray-700 cursor-pointer">
                Adresse anzeigen
              </label>
            </div>
            {footerShowAddress && (
              <input
                type="text"
                value={footerAddress}
                onChange={(e) => setFooterAddress(e.target.value)}
                placeholder="Rosenstraße 19, 26529 Marienhafe, Deutschland"
                className="flex-1 px-3 py-1.5 border border-stone-300 rounded-md text-xs bg-white"
              />
            )}
          </div>

          {/* E-Mail */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 min-w-[150px]">
              <input
                type="checkbox"
                id="footerShowEmail"
                checked={footerShowEmail}
                onChange={(e) => setFooterShowEmail(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
              />
              <label htmlFor="footerShowEmail" className="text-xs font-medium text-gray-700 cursor-pointer">
                E-Mail anzeigen
              </label>
            </div>
            {footerShowEmail && (
              <input
                type="email"
                value={footerSupportEmail}
                onChange={(e) => setFooterSupportEmail(e.target.value)}
                placeholder="kontakt@topgartengeraete.de"
                className="flex-1 px-3 py-1.5 border border-stone-300 rounded-md text-xs bg-white"
              />
            )}
          </div>

          {/* Telefon */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 min-w-[150px]">
              <input
                type="checkbox"
                id="footerShowPhone"
                checked={footerShowPhone}
                onChange={(e) => setFooterShowPhone(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
              />
              <label htmlFor="footerShowPhone" className="text-xs font-medium text-gray-700 cursor-pointer">
                Telefon anzeigen
              </label>
            </div>
            {footerShowPhone && (
              <input
                type="text"
                value={footerSupportPhone}
                onChange={(e) => setFooterSupportPhone(e.target.value)}
                placeholder="+49 ..."
                className="flex-1 px-3 py-1.5 border border-stone-300 rounded-md text-xs bg-white"
              />
            )}
          </div>

          {/* Siegel / Badge */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Qualitätssiegel / Badge-Text</label>
            <input
              type="text"
              value={footerBadgeText}
              onChange={(e) => setFooterBadgeText(e.target.value)}
              placeholder="Geprüfte Fachhändler-Qualität"
              className="w-full sm:w-80 px-3 py-1.5 border border-stone-300 rounded-md text-xs bg-white"
            />
          </div>
        </div>
      </div>

      {/* 4. Horizontale Kategorien-Leiste */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <div>
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <span>🏷️</span> Horizontale Kategorien-Leiste (Mitte)
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Zeigt eine Leiste mit Ihren Shop-Kategorien direkt vor dem Copyright an.
          </p>
        </div>

        <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="footerShowCategoriesStrip"
              checked={footerShowCategoriesStrip}
              onChange={(e) => setFooterShowCategoriesStrip(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
            />
            <label htmlFor="footerShowCategoriesStrip" className="text-xs font-semibold text-gray-700 cursor-pointer">
              Kategorien-Leiste aktivieren
            </label>
          </div>
          {footerShowCategoriesStrip && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-stone-500">Präfix / Titel:</label>
              <input
                type="text"
                value={footerCategoriesTitle}
                onChange={(e) => setFooterCategoriesTitle(e.target.value)}
                placeholder="Kategorien :"
                className="px-2.5 py-1 border border-stone-300 rounded-md text-xs bg-white w-36"
              />
            </div>
          )}
        </div>
      </div>

      {/* 5. Copyright & Zahlungsarten-Leiste */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <div>
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <span>💳</span> Copyright & Zahlungsarten-Badges
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Wählen Sie den Copyright-Text und welche Zahlungslogos in der Leiste ganz unten angezeigt werden.
          </p>
        </div>

        <div className="space-y-4 bg-stone-50 p-5 rounded-lg border border-stone-200">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Copyright-Text</label>
            <input
              type="text"
              value={footerCopyright}
              onChange={(e) => setFooterCopyright(e.target.value)}
              placeholder="© 2026 TOP GARTENGERÄTE"
              className="w-full sm:w-96 px-3 py-2 border border-stone-300 rounded-md text-xs bg-white font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Zahlungsmethoden-Badges</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <label className="flex items-center gap-2 text-xs text-stone-700 bg-white p-2.5 rounded border border-stone-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={footerPaymentVisa}
                  onChange={(e) => setFooterPaymentVisa(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-bold text-[#1a1f71]">VISA</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-stone-700 bg-white p-2.5 rounded border border-stone-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={footerPaymentCb}
                  onChange={(e) => setFooterPaymentCb(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-bold text-[#00826b]">CB (Cartes)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-stone-700 bg-white p-2.5 rounded border border-stone-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={footerPaymentAmex}
                  onChange={(e) => setFooterPaymentAmex(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-bold text-[#2e77bc]">American Express</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-stone-700 bg-white p-2.5 rounded border border-stone-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={footerPaymentMaestro}
                  onChange={(e) => setFooterPaymentMaestro(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-bold text-[#0066b2]">Maestro</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-stone-700 bg-white p-2.5 rounded border border-stone-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={footerPaymentMastercard}
                  onChange={(e) => setFooterPaymentMastercard(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-bold text-stone-900">MasterCard</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-stone-700 bg-white p-2.5 rounded border border-stone-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={footerPaymentPaypal}
                  onChange={(e) => setFooterPaymentPaypal(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-bold text-[#003087]">PayPal</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-stone-700 bg-white p-2.5 rounded border border-stone-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={footerPaymentApplePay}
                  onChange={(e) => setFooterPaymentApplePay(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-bold text-stone-800"> Apple Pay</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-stone-700 bg-white p-2.5 rounded border border-stone-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={footerPaymentGooglePay}
                  onChange={(e) => setFooterPaymentGooglePay(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-bold text-stone-800">Google Pay</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
        <p className="text-xs text-stone-500">
          Nach dem Speichern werden alle Änderungen sofort auf der gesamten Website sichtbar.
        </p>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2.5 bg-[#00a86b] text-white rounded-lg hover:bg-[#008f5b] disabled:bg-gray-400 text-sm font-semibold shadow-sm transition-colors"
        >
          {isLoading ? 'Speichern...' : 'Änderungen speichern'}
        </button>
      </div>
    </form>
  );
}
