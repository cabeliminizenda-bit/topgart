'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveThankYouSettings } from '@/actions/settings';
import Link from 'next/link';

interface ThankYouPageFormProps {
  initialSettings: Record<string, string>;
}

export default function ThankYouPageForm({ initialSettings }: ThankYouPageFormProps) {
  const router = useRouter();

  const [couponCode, setCouponCode] = useState(initialSettings.THANKYOU_COUPON_CODE || 'WELCOME15');
  const [couponAmount, setCouponAmount] = useState(initialSettings.THANKYOU_COUPON_AMOUNT || '15');
  const [badge, setBadge] = useState(initialSettings.THANKYOU_BADGE || 'Dein Willkommensgeschenk');
  const [discountTitle, setDiscountTitle] = useState(initialSettings.THANKYOU_DISCOUNT_TITLE || '15 € Rabatt');
  const [discountDesc, setDiscountDesc] = useState(
    initialSettings.THANKYOU_DISCOUNT_DESC ||
    'Sichere dir als Dankeschön für deine Newsletter-Anmeldung 15 € Rabatt auf deine nächste Bestellung!'
  );
  const [couponSubtitle, setCouponSubtitle] = useState(initialSettings.THANKYOU_COUPON_SUBTITLE || 'Einfach beim Bestellvorgang eingeben');
  const [infoTitle, setInfoTitle] = useState(initialSettings.THANKYOU_INFO_TITLE || 'Immer bestens informiert!');
  const [infoDesc, setInfoDesc] = useState(
    initialSettings.THANKYOU_INFO_DESC ||
    'Entdecke exklusive Angebote, attraktive Aktionen, Produktneuheiten und praktische Tipps rund um moderne Hausgeräte.'
  );
  const [ctaText, setCtaText] = useState(initialSettings.THANKYOU_CTA_TEXT || 'Jetzt HLG Hausgeräte entdecken');
  const [ctaLink, setCtaLink] = useState(initialSettings.THANKYOU_CTA_LINK || '/shop');
  const [footerNote, setFooterNote] = useState(initialSettings.THANKYOU_FOOTER_NOTE || 'Vielen Dank für dein Vertrauen. Wir freuen uns auf dich!');

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    const res = await saveThankYouSettings({
      THANKYOU_COUPON_CODE: couponCode.trim().toUpperCase(),
      THANKYOU_COUPON_AMOUNT: couponAmount.trim(),
      THANKYOU_BADGE: badge.trim(),
      THANKYOU_DISCOUNT_TITLE: discountTitle.trim(),
      THANKYOU_DISCOUNT_DESC: discountDesc.trim(),
      THANKYOU_COUPON_SUBTITLE: couponSubtitle.trim(),
      THANKYOU_INFO_TITLE: infoTitle.trim(),
      THANKYOU_INFO_DESC: infoDesc.trim(),
      THANKYOU_CTA_TEXT: ctaText.trim(),
      THANKYOU_CTA_LINK: ctaLink.trim(),
      THANKYOU_FOOTER_NOTE: footerNote.trim(),
    });

    setIsLoading(false);
    if (res?.error) {
      setError(res.error);
    } else {
      setMessage('Die Einstellungen der Thank-You-Seite und der Gutscheincode wurden erfolgreich gespeichert!');
      router.refresh();
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Quick Links */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thank-You-Seite & Willkommens-Gutschein</h1>
          <p className="text-sm text-gray-500 mt-1">
            Passen Sie den Gutscheincode, den Rabattwert und alle Texte der Newsletter-Bestätigungsseite an.
          </p>
        </div>
        <Link
          href="/thank-you"
          target="_blank"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-[#107b46] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition"
        >
          <span>Live-Seite öffnen</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </Link>
      </div>

      {message && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form settings */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-6">
          
          {/* Section 1: Gutschein-Einstellungen */}
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
              <span>🎟️</span>
              <span>Gutscheincode & Rabattbetrag</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Gutscheincode (Wird an der Kasse eingelöst)
                </label>
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  required
                  placeholder="z.B. WELCOME15"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 font-mono font-bold text-gray-900 uppercase focus:ring-2 focus:ring-[#107b46] focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Rabattbetrag in €
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  value={couponAmount}
                  onChange={(e) => setCouponAmount(e.target.value)}
                  required
                  placeholder="z.B. 15"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 font-bold text-gray-900 focus:ring-2 focus:ring-[#107b46] focus:border-transparent outline-none"
                />
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              💡 Der Gutschein wird bei jedem Speichern automatisch im Shop aktiviert.
            </p>
          </div>

          {/* Section 2: Text-Anpassungen */}
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
              <span>✍️</span>
              <span>Inhalte der Dankesseite</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Badge-Text (Oberhalb der Überschrift)
                </label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:ring-2 focus:ring-[#107b46] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Hauptüberschrift
                </label>
                <input
                  type="text"
                  value={discountTitle}
                  onChange={(e) => setDiscountTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-[#107b46] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Beschreibung
                </label>
                <textarea
                  rows={2}
                  value={discountDesc}
                  onChange={(e) => setDiscountDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:ring-2 focus:ring-[#107b46] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Hinweistext unter dem Gutscheincode
                </label>
                <input
                  type="text"
                  value={couponSubtitle}
                  onChange={(e) => setCouponSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:ring-2 focus:ring-[#107b46] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Info & CTA Button */}
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
              <span>🔘</span>
              <span>Info-Bereich & Call-to-Action</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Info-Titel
                </label>
                <input
                  type="text"
                  value={infoTitle}
                  onChange={(e) => setInfoTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:ring-2 focus:ring-[#107b46] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Info-Beschreibung
                </label>
                <textarea
                  rows={2}
                  value={infoDesc}
                  onChange={(e) => setInfoDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:ring-2 focus:ring-[#107b46] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Button-Text
                  </label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-[#107b46] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Button-Zieladresse
                  </label>
                  <input
                    type="text"
                    value={ctaLink}
                    onChange={(e) => setCtaLink(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:ring-2 focus:ring-[#107b46] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Fußzeilen-Hinweis
                </label>
                <input
                  type="text"
                  value={footerNote}
                  onChange={(e) => setFooterNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:ring-2 focus:ring-[#107b46] outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 rounded-lg text-sm font-bold text-white bg-[#107b46] hover:bg-[#0d693b] disabled:opacity-50 transition shadow-sm flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Wird gespeichert...</span>
                </>
              ) : (
                <span>Änderungen speichern</span>
              )}
            </button>
          </div>
        </form>

        {/* Live Preview Card */}
        <div className="lg:col-span-5">
          <div className="sticky top-6 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Live-Vorschau</span>
              <span className="text-xs text-gray-400">Automatische Vorschau</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center shadow-xs">
              <div className="text-xs font-extrabold tracking-[0.2em] text-slate-800 uppercase mb-2">
                HLG HAUSGERÄTE
              </div>

              <div className="w-9 h-9 mx-auto mb-2 rounded-full bg-emerald-50 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div className="text-base font-extrabold text-slate-900 mb-1">
                Vielen Dank für deine Anmeldung!
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Willkommen bei HLG Hausgeräte!
              </p>

              {/* Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs text-center">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 mb-2">
                  {badge || 'Dein Willkommensgeschenk'}
                </span>

                <div className="text-2xl font-black text-slate-900 mb-1">
                  {discountTitle || `${couponAmount} € Rabatt`}
                </div>

                <p className="text-xs text-slate-600 mb-4 line-clamp-2">
                  {discountDesc}
                </p>

                <div className="border-2 border-dashed border-slate-300 bg-slate-50/70 rounded-lg p-3 my-3">
                  <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                    DEIN RABATTCODE
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-wider my-1">
                    {couponCode || 'WELCOME15'}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium">
                    {couponSubtitle}
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-xs font-bold text-slate-900 mb-1">
                    {infoTitle}
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">
                    {infoDesc}
                  </p>

                  <div className="w-full py-2.5 px-4 rounded-lg text-xs font-bold text-white bg-slate-900">
                    {ctaText}
                  </div>

                  <p className="text-[10px] text-slate-400 mt-2">
                    {footerNote}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
