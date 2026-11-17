'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ThankYouClientProps {
  settings?: Record<string, string>;
}

export default function ThankYouClient({ settings = {} }: ThankYouClientProps) {
  const [copied, setCopied] = useState(false);

  const couponCode = (settings.THANKYOU_COUPON_CODE || 'WELCOME15').trim().toUpperCase();
  const couponAmount = settings.THANKYOU_COUPON_AMOUNT || '15';
  const badgeText = settings.THANKYOU_BADGE || 'Dein Willkommensgeschenk';
  const discountTitle = settings.THANKYOU_DISCOUNT_TITLE || `${couponAmount} € Rabatt`;
  const discountDesc = settings.THANKYOU_DISCOUNT_DESC || `Sichere dir als Dankeschön für deine Newsletter-Anmeldung ${couponAmount} € Rabatt auf deine nächste Bestellung!`;
  const couponSubtitle = settings.THANKYOU_COUPON_SUBTITLE || 'Einfach beim Bestellvorgang eingeben';
  const infoTitle = settings.THANKYOU_INFO_TITLE || 'Immer bestens informiert!';
  const infoDesc = settings.THANKYOU_INFO_DESC || 'Entdecke exklusive Angebote, attraktive Aktionen, Produktneuheiten und praktische Tipps rund um moderne Hausgeräte.';
  const ctaText = settings.THANKYOU_CTA_TEXT || 'Jetzt HLG Hausgeräte entdecken';
  const ctaLink = settings.THANKYOU_CTA_LINK || '/shop';
  const footerNote = settings.THANKYOU_FOOTER_NOTE || 'Vielen Dank für dein Vertrauen. Wir freuen uns auf dich!';

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(couponCode);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = couponCode;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="min-h-[75vh] bg-slate-50/70 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans">
      <div className="max-w-xl w-full mx-auto">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-xs sm:text-sm font-extrabold tracking-[0.25em] text-slate-800 uppercase mb-3">
            HLG HAUSGERÄTE
          </div>

          <div className="w-11 h-11 mx-auto mb-3 rounded-full bg-emerald-50 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-600">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Vielen Dank für deine Anmeldung!
          </h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Willkommen bei HLG Hausgeräte! Schön, dass du Teil unserer Community bist.
          </p>
        </div>

        <div className="border-t border-slate-200/90 mb-6" />

        {/* Gift Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-9 text-center">
          <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 mb-3">
            {badgeText}
          </span>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            {discountTitle}
          </h2>

          <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
            {discountDesc}
          </p>

          {/* Coupon Box */}
          <div className="border-2 border-dashed border-slate-300 bg-slate-50/70 rounded-xl p-5 my-6">
            <div className="text-[11px] font-bold tracking-widest text-slate-500 uppercase mb-1">
              DEIN RABATTCODE
            </div>

            <div className="flex items-center justify-center gap-3 my-2">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-wider text-slate-900 font-mono select-all">
                {couponCode}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-slate-200/80 hover:bg-slate-300 text-slate-700 transition"
                title="Gutscheincode kopieren"
              >
                {copied ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-emerald-700 font-semibold">Kopiert!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span>Kopieren</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-xs text-emerald-700 font-medium">
              {couponSubtitle}
            </div>
          </div>

          {/* Info Section */}
          <div className="pt-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
              {infoTitle}
            </h3>
            <p className="text-sm text-slate-600 max-w-lg mx-auto mb-6">
              {infoDesc}
            </p>

            <Link
              href={ctaLink}
              className="inline-flex items-center justify-center w-full py-3.5 px-6 rounded-lg text-sm sm:text-base font-bold text-white bg-slate-900 hover:bg-slate-800 transition shadow-sm"
            >
              {ctaText}
            </Link>

            <p className="text-xs text-slate-500 mt-4">
              {footerNote}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
