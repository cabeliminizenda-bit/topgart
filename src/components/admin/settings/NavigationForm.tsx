'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateSettingsBatch } from '@/actions/settings';

interface NavLink {
  label: string;
  url: string;
}

const DEFAULT_MAIN_MENU_LINKS: NavLink[] = [
  { label: 'AGB', url: '/agb' },
  { label: 'ZAHLUNGSART', url: '/zahlungsinformationen' },
  { label: 'ÜBER UNS', url: '/ueber-uns' },
  { label: 'KONTAKT', url: '/kontakt' },
  { label: 'BLOG', url: '/blog' },
  { label: 'BESTELLUNG VERFOLGEN', url: '/order-tracking' },
];

const DEFAULT_TOP_BAR_LINKS: NavLink[] = [
  { label: 'AGB', url: '/agb' },
  { label: 'Blog', url: '/blog' },
  { label: 'Versand', url: '/lieferzeiten' },
  { label: 'Widerrufsbelehrung', url: '/widerrufsbelehrung' },
];

export default function NavigationForm({ initialSettings }: { initialSettings: Record<string, string> }) {
  const tSettings = useTranslations('AdminSettings');
  const router = useRouter();

  // 1. Main Header Menu Links
  const [headerLinks, setHeaderLinks] = useState<NavLink[]>(() => {
    try {
      if (initialSettings.HEADER_MENU_LINKS) {
        const parsed = JSON.parse(initialSettings.HEADER_MENU_LINKS);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const isOld = parsed.length === 4 && parsed[0]?.label === 'Startseite' && parsed[1]?.label === 'Shop';
          if (!isOld) {
            return parsed;
          }
        }
      }
    } catch {}
    return DEFAULT_MAIN_MENU_LINKS;
  });

  // Green Shop Button
  const [headerShopBtnText, setHeaderShopBtnText] = useState(
    initialSettings.HEADER_SHOP_BTN_TEXT || 'ZUM SHOP GEHEN'
  );

  // 2. Top Bar Links
  const [topBarLinks, setTopBarLinks] = useState<NavLink[]>(() => {
    try {
      if (initialSettings.TOP_BAR_LINKS) {
        const parsed = JSON.parse(initialSettings.TOP_BAR_LINKS);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const isOld = parsed.length === 1 && parsed[0]?.icon === 'truck';
          if (!isOld) {
            return parsed.map((p: any) => ({ label: p.label || '', url: p.url || '' }));
          }
        }
      }
    } catch {}
    return DEFAULT_TOP_BAR_LINKS;
  });

  // 3. Auth & Account
  const [loginText, setLoginText] = useState(initialSettings.LOGIN_TEXT || 'Anmelden');
  const [myAccountText, setMyAccountText] = useState(initialSettings.MY_ACCOUNT_TEXT || 'Mein Konto');
  const [adminDashboardText, setAdminDashboardText] = useState(initialSettings.ADMIN_DASHBOARD_TEXT || 'Admin-Dashboard');

  // 4. Mobile Navigation & Contact
  const [mobileAboutTitle, setMobileAboutTitle] = useState(initialSettings.MOBILE_ABOUT_TITLE || 'Top Gartengeräte');
  const [mobileAboutDesc, setMobileAboutDesc] = useState(initialSettings.MOBILE_ABOUT_DESC || 'Ihr Fachhändler für hochwertige Gartengeräte.');
  const [mobileContactAddress, setMobileContactAddress] = useState(initialSettings.MOBILE_CONTACT_ADDRESS ?? (initialSettings.FOOTER_ADDRESS_1 || 'Rosenstraße 19, 26529 Marienhafe, Deutschland'));
  const [mobileContactPhone, setMobileContactPhone] = useState(initialSettings.MOBILE_CONTACT_PHONE ?? (initialSettings.FOOTER_SUPPORT_PHONE || ''));
  const [mobileContactEmail, setMobileContactEmail] = useState(initialSettings.MOBILE_CONTACT_EMAIL ?? (initialSettings.FOOTER_SUPPORT_EMAIL || 'kontakt@topgartengeraete.de'));
  const [mobileContactWebsite, setMobileContactWebsite] = useState(initialSettings.MOBILE_CONTACT_WEBSITE ?? 'topgartengeraete.de');

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const moveLink = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= headerLinks.length) return;
    const updated = [...headerLinks];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setHeaderLinks(updated);
  };

  const handleResetMainMenu = () => {
    if (confirm('Möchten Sie das Hauptmenü auf die 6 Standardlinks (AGB, ZAHLUNGSART, ÜBER UNS, KONTAKT, BLOG, BESTELLUNG VERFOLGEN) zurücksetzen?')) {
      setHeaderLinks(DEFAULT_MAIN_MENU_LINKS);
    }
  };

  const handleResetTopBar = () => {
    if (confirm('Möchten Sie die Top-Bar-Links auf die 4 Standardlinks zurücksetzen?')) {
      setTopBarLinks(DEFAULT_TOP_BAR_LINKS);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      await updateSettingsBatch({
        HEADER_MENU_LINKS: JSON.stringify(headerLinks),
        HEADER_SHOP_BTN_TEXT: headerShopBtnText.trim() || 'ZUM SHOP GEHEN',
        TOP_BAR_LINKS: JSON.stringify(topBarLinks),
        LOGIN_TEXT: loginText.trim(),
        MY_ACCOUNT_TEXT: myAccountText.trim(),
        ADMIN_DASHBOARD_TEXT: adminDashboardText.trim(),
        MOBILE_ABOUT_TITLE: mobileAboutTitle.trim(),
        MOBILE_ABOUT_DESC: mobileAboutDesc.trim(),
        MOBILE_CONTACT_ADDRESS: mobileContactAddress.trim(),
        MOBILE_CONTACT_PHONE: mobileContactPhone.trim(),
        MOBILE_CONTACT_EMAIL: mobileContactEmail.trim(),
        MOBILE_CONTACT_WEBSITE: mobileContactWebsite.trim(),
      });

      setMessage('Die Navigationsmenüs wurden erfolgreich gespeichert.');
      router.refresh();
    } catch {
      setMessage('Fehler beim Speichern der Menüs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Navigationsmenüs verwalten</h2>
          <p className="text-sm text-gray-500 mt-1">
            Passen Sie das Hauptmenü des Headers, die Top-Bar-Kurzlinks und die mobile Navigation an.
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

      {/* 1. Hauptmenü des Headers (Main Navigation) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <span>🧭</span> Hauptmenü des Headers (Leiste neben dem grünen Button)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Diese Links werden in der Haupt-Navigationsleiste des Headers auf Desktop- und Mobilgeräten angezeigt.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetMainMenu}
              className="text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-md border border-stone-200 transition-colors"
            >
              Standard 6 Links laden
            </button>
            <button
              type="button"
              onClick={() => setHeaderLinks([...headerLinks, { label: '', url: '' }])}
              className="text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-md border border-emerald-200 flex items-center gap-1 transition-colors"
            >
              + Link hinzufügen
            </button>
          </div>
        </div>

        {/* Grüner CTA-Button Einstellung */}
        <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-[#00a86b]" />
            <label className="text-xs font-semibold text-gray-700">Grüner Button (Shop-Katalog):</label>
          </div>
          <input
            type="text"
            value={headerShopBtnText}
            onChange={(e) => setHeaderShopBtnText(e.target.value)}
            placeholder="ZUM SHOP GEHEN"
            className="w-full sm:w-64 px-3 py-1.5 border border-stone-300 rounded-md text-xs font-bold bg-white uppercase tracking-wider text-stone-800"
          />
          <span className="text-[11px] text-stone-400">
            Öffnet das Kategorien-Dropdown und führt zum Shop.
          </span>
        </div>

        {/* Links List */}
        <div className="space-y-2.5">
          {headerLinks.map((link, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-white p-2.5 border border-stone-200 rounded-lg shadow-2xs hover:border-stone-300 transition-colors"
            >
              <div className="flex items-center gap-1 text-stone-400 shrink-0">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveLink(index, 'up')}
                  className="p-1 hover:text-stone-700 disabled:opacity-30 disabled:hover:text-stone-400 cursor-pointer"
                  title="Nach oben verschieben"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  disabled={index === headerLinks.length - 1}
                  onClick={() => moveLink(index, 'down')}
                  className="p-1 hover:text-stone-700 disabled:opacity-30 disabled:hover:text-stone-400 cursor-pointer"
                  title="Nach unten verschieben"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <span className="text-[11px] font-mono text-stone-400 w-5 text-center">{index + 1}.</span>
              </div>

              <input
                type="text"
                placeholder="Label (z.B. AGB)"
                value={link.label}
                onChange={(e) => {
                  const updated = [...headerLinks];
                  updated[index].label = e.target.value;
                  setHeaderLinks(updated);
                }}
                className="w-1/3 min-w-[130px] px-3 py-1.5 border border-stone-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 uppercase"
              />

              <input
                type="text"
                placeholder="Ziel-URL (z.B. /agb)"
                value={link.url}
                onChange={(e) => {
                  const updated = [...headerLinks];
                  updated[index].url = e.target.value;
                  setHeaderLinks(updated);
                }}
                className="flex-1 px-3 py-1.5 border border-stone-300 rounded-md text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />

              <button
                type="button"
                onClick={() => setHeaderLinks(headerLinks.filter((_, i) => i !== index))}
                className="text-stone-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors"
                title="Link löschen"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Top-Bar Kurzlinks (Obere Leiste) */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <span>📌</span> Obere Kurzlinks (Top-Bar ganz oben)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Rechtliche und praktische Schnelllinks in der feinen Leiste ganz oben über dem Logo.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetTopBar}
              className="text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-md border border-stone-200 transition-colors"
            >
              Standard 4 Kurzlinks laden
            </button>
            <button
              type="button"
              onClick={() => setTopBarLinks([...topBarLinks, { label: '', url: '' }])}
              className="text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-md border border-emerald-200 flex items-center gap-1 transition-colors"
            >
              + Link hinzufügen
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          {topBarLinks.map((link, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-stone-50 p-2.5 border border-stone-200 rounded-lg shadow-2xs"
            >
              <span className="text-[11px] font-mono text-stone-400 w-5 text-center">{index + 1}.</span>
              <input
                type="text"
                placeholder="Label (z.B. Versand)"
                value={link.label}
                onChange={(e) => {
                  const updated = [...topBarLinks];
                  updated[index].label = e.target.value;
                  setTopBarLinks(updated);
                }}
                className="w-1/3 min-w-[130px] px-3 py-1.5 border border-stone-300 rounded-md text-xs bg-white"
              />
              <input
                type="text"
                placeholder="Ziel-URL (z.B. /lieferzeiten)"
                value={link.url}
                onChange={(e) => {
                  const updated = [...topBarLinks];
                  updated[index].url = e.target.value;
                  setTopBarLinks(updated);
                }}
                className="flex-1 px-3 py-1.5 border border-stone-300 rounded-md text-xs font-mono bg-white"
              />
              <button
                type="button"
                onClick={() => setTopBarLinks(topBarLinks.filter((_, i) => i !== index))}
                className="text-stone-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50"
                title="Entfernen"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Texte für Authentifizierung & Kundenkonto */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <div>
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <span>👤</span> Kundenkonto & Anmelde-Texte
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Texte für den Login-Bereich oben rechts neben dem Warenkorb.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-stone-50 p-4 rounded-lg border border-stone-200">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Anmelden-Text</label>
            <input
              type="text"
              value={loginText}
              onChange={(e) => setLoginText(e.target.value)}
              placeholder="Anmelden"
              className="w-full px-3 py-1.5 border border-stone-300 rounded-md text-xs bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mein-Konto-Text</label>
            <input
              type="text"
              value={myAccountText}
              onChange={(e) => setMyAccountText(e.target.value)}
              placeholder="Mein Konto"
              className="w-full px-3 py-1.5 border border-stone-300 rounded-md text-xs bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Admin-Dashboard-Text</label>
            <input
              type="text"
              value={adminDashboardText}
              onChange={(e) => setAdminDashboardText(e.target.value)}
              placeholder="Admin-Dashboard"
              className="w-full px-3 py-1.5 border border-stone-300 rounded-md text-xs bg-white"
            />
          </div>
        </div>
      </div>

      {/* 4. Mobiles Seitenmenü (Mobile Sidebar) */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <div>
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <span>📱</span> Mobiles Seitenmenü & Kontaktdaten
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Angaben im mobilen Drawer-Menü (Hamburger-Menü auf Smartphones und Tablets).
          </p>
        </div>

        <div className="space-y-3 bg-stone-50 p-4 rounded-lg border border-stone-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Über uns Titel</label>
              <input
                type="text"
                value={mobileAboutTitle}
                onChange={(e) => setMobileAboutTitle(e.target.value)}
                className="w-full px-3 py-1.5 border border-stone-300 rounded-md text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Website URL</label>
              <input
                type="text"
                value={mobileContactWebsite}
                onChange={(e) => setMobileContactWebsite(e.target.value)}
                className="w-full px-3 py-1.5 border border-stone-300 rounded-md text-xs bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Kurzbeschreibung</label>
            <textarea
              value={mobileAboutDesc}
              onChange={(e) => setMobileAboutDesc(e.target.value)}
              rows={2}
              className="w-full px-3 py-1.5 border border-stone-300 rounded-md text-xs bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Telefon</label>
              <input
                type="text"
                value={mobileContactPhone}
                onChange={(e) => setMobileContactPhone(e.target.value)}
                className="w-full px-3 py-1.5 border border-stone-300 rounded-md text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">E-Mail</label>
              <input
                type="email"
                value={mobileContactEmail}
                onChange={(e) => setMobileContactEmail(e.target.value)}
                className="w-full px-3 py-1.5 border border-stone-300 rounded-md text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Adresse</label>
              <input
                type="text"
                value={mobileContactAddress}
                onChange={(e) => setMobileContactAddress(e.target.value)}
                className="w-full px-3 py-1.5 border border-stone-300 rounded-md text-xs bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
        <p className="text-xs text-stone-500">
          Nach dem Speichern werden alle Menü-Änderungen sofort im Header der Website sichtbar.
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
