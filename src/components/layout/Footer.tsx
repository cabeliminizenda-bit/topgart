'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export type FooterColumn = {
  title: string;
  links: Array<{ label: string; url: string }>;
};

export type FooterProps = {
  supportPhone?: string;
  supportEmail?: string;
  footerBgColor?: string;
  footerTextColor?: string;
  footerHeadingColor?: string;
  footerAccentColor?: string;
  footerAddress1?: string;
  footerAddress2?: string;
  footerLocationsTitle?: string;
  footerContactTitle?: string;
  footerBadgeText?: string;
  footerShowCategoriesStrip?: boolean;
  footerCategoriesTitle?: string;
  footerNewsletterTitle?: string;
  footerNewsletterText?: string;
  footerNewsletterPlaceholder?: string;
  footerCallUsText?: string;
  footerCopyright?: string;
  footerSocialFacebook?: string;
  footerSocialTwitter?: string;
  footerSocialInstagram?: string;
  footerSocialLinkedin?: string;
  footerColumns?: FooterColumn[];
  categories?: Array<{ id: string; name: string; slug: string | null }>;
  footerLogoImage?: string;
  footerDescription?: string;
  footerShowAddress?: boolean;
  footerShowEmail?: boolean;
  footerShowPhone?: boolean;
  footerPaymentAmex?: boolean;
  footerPaymentApplePay?: boolean;
  footerPaymentGooglePay?: boolean;
  footerPaymentMastercard?: boolean;
  footerPaymentVisa?: boolean;
  footerPaymentPaypal?: boolean;
  footerPaymentCb?: boolean;
  footerPaymentMaestro?: boolean;
  footerPaymentOpay?: boolean;
  contactSlug?: string;
};

const DEFAULT_CATEGORY_STRIP = [
  { label: 'Akku-Rasenmäher', url: '/shop?category=akku-rasenmaeher' },
  { label: 'Benzin-Rasenmäher', url: '/shop?category=benzin-rasenmaeher' },
  { label: 'Kettensäge & Rasentrimmer', url: '/shop?category=kettensaege-rasentrimmer' },
  { label: 'Mähroboter', url: '/shop?category=maehroboter' },
  { label: 'Rasenmäher', url: '/shop?category=rasenmaeher' },
  { label: 'Rasentraktoren', url: '/shop?category=rasentraktoren' },
];

const getDefaultColumns = (contactSlug: string = 'kontakt'): FooterColumn[] => [
  {
    title: 'Rechtliches',
    links: [
      { label: 'AGB', url: '/agb' },
      { label: 'Impressum', url: '/impressum' },
      { label: 'Über uns', url: '/ueber-uns' },
      { label: 'Datenschutzrichtlinie', url: '/datenschutz' },
      { label: 'Kontakt', url: `/${contactSlug}` },
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

export default function Footer({
  supportPhone,
  supportEmail = 'kontakt@topgartengeraete.de',
  footerBgColor = '#ffffff',
  footerTextColor = '#444444',
  footerHeadingColor = '#e05246',
  footerAccentColor = '#00a86b',
  footerAddress1 = 'Rosenstraße 19, 26529 Marienhafe, Deutschland',
  footerContactTitle = 'Kontaktinformationen',
  footerBadgeText = 'Geprüfte Fachhändler-Qualität',
  footerShowCategoriesStrip = true,
  footerCategoriesTitle = 'Kategorien :',
  footerCopyright = '© 2026 TOP GARTENGERÄTE',
  footerColumns,
  categories = [],
  footerShowAddress = true,
  footerShowEmail = true,
  footerShowPhone = false,
  footerPaymentAmex = true,
  footerPaymentApplePay = false,
  footerPaymentGooglePay = false,
  footerPaymentMastercard = true,
  footerPaymentVisa = true,
  footerPaymentPaypal = true,
  footerPaymentCb = true,
  footerPaymentMaestro = true,
  contactSlug = 'kontakt',
}: FooterProps) {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  const displayAddress =
    footerAddress1 &&
    footerAddress1.trim() !== '' &&
    footerAddress1.trim().toLowerCase() !== 'deutschland' &&
    !footerAddress1.includes('Borseler') &&
    !footerAddress1.includes('Borsteler') &&
    !footerAddress1.includes('Westheimer')
      ? footerAddress1
      : 'Rosenstraße 19, 26529 Marienhafe, Deutschland';

  const displayEmail =
    supportEmail &&
    supportEmail.trim() !== '' &&
    !supportEmail.includes('hlg') &&
    !supportEmail.includes('mystore.com')
      ? supportEmail
      : 'kontakt@topgartengeraete.de';

  const displayPhone = supportPhone && supportPhone.trim() !== '' ? supportPhone : '';

  const displayCopyright =
    footerCopyright &&
    !footerCopyright.includes('HLG') &&
    !footerCopyright.includes('Silva Dias')
      ? footerCopyright
      : '© 2026 TOP GARTENGERÄTE';

  // Use configured columns if present and not empty, otherwise default 4 columns
  const activeColumns = (footerColumns && footerColumns.length > 0)
    ? footerColumns
    : getDefaultColumns(contactSlug);

  const filteredDbCats = (categories || []).filter((c) => {
    const slug = (c.slug || '').toLowerCase();
    const name = c.name.toLowerCase();
    return slug !== 'uncategorized' && name !== 'uncategorized' && name !== 'allgemein';
  });

  const bottomCategoryLinks =
    filteredDbCats.length > 0
      ? filteredDbCats.slice(0, 8).map((c) => ({
          label: c.name,
          url: `/shop?category=${encodeURIComponent(c.slug || c.id)}`,
        }))
      : DEFAULT_CATEGORY_STRIP;

  return (
    <footer
      className="font-sans border-t border-stone-100 mt-auto pb-16 lg:pb-0 transition-colors"
      style={{ backgroundColor: footerBgColor || '#ffffff', color: footerTextColor || '#444444' }}
    >
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Dynamic Navigation Columns */}
          {activeColumns.map((col, idx) => {
            const colId = `col-${idx}`;
            const isOpen = openSection === colId;
            // Balance column width: 4 columns = lg:col-span-2 each (8 cols total) + contact = lg:col-span-4 (12 cols)
            const colSpan = activeColumns.length <= 2 ? 'lg:col-span-4' : activeColumns.length === 3 ? 'lg:col-span-3' : 'lg:col-span-2';

            return (
              <div key={`${col.title}-${idx}`} className={colSpan}>
                {/* Mobile Accordion Trigger */}
                <button
                  type="button"
                  onClick={() => toggleSection(colId)}
                  className="w-full flex items-center justify-between md:hidden py-2 border-b border-stone-100 text-left cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="text-[14.5px] font-medium" style={{ color: footerHeadingColor || '#e05246' }}>
                    {col.title}
                  </span>
                  <svg
                    className={`w-4 h-4 text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Desktop Heading */}
                <h3
                  className="hidden md:block text-[14.5px] font-medium mb-3.5"
                  style={{ color: footerHeadingColor || '#e05246' }}
                >
                  {col.title}
                </h3>

                <ul className={`space-y-2.5 text-[13px] mt-2.5 md:mt-0 ${isOpen ? 'block' : 'hidden md:block'}`}>
                  {col.links.map((item, lIdx) => (
                    <li key={`${item.label}-${lIdx}`}>
                      <Link
                        href={item.url}
                        className="hover:text-[#00a86b] transition-colors inline-block"
                        style={{ color: footerTextColor || '#444444' }}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {/* Contact Information Column */}
          <div className="lg:col-span-4">
            <h3
              className="text-[14.5px] font-medium mb-3.5"
              style={{ color: footerHeadingColor || '#e05246' }}
            >
              {footerContactTitle || 'Kontaktinformationen'}
            </h3>

            <div className="space-y-3 text-[13px]" style={{ color: footerTextColor || '#444444' }}>
              {footerShowAddress && displayAddress && (
                <div className="flex items-start gap-2.5">
                  <svg
                    className="w-4 h-4 shrink-0 mt-0.5 opacity-80"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.7}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.7}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>{displayAddress}</span>
                </div>
              )}

              {footerShowEmail && displayEmail && (
                <div className="flex items-center gap-2.5">
                  <svg
                    className="w-4 h-4 shrink-0 opacity-80"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.7}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <a
                    href={`mailto:${displayEmail}`}
                    className="hover:text-[#00a86b] transition-colors"
                    style={{ color: footerTextColor || '#444444' }}
                  >
                    {displayEmail}
                  </a>
                </div>
              )}

              {footerShowPhone && displayPhone && (
                <div className="flex items-center gap-2.5">
                  <svg
                    className="w-4 h-4 shrink-0 opacity-80"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.7}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <a
                    href={`tel:${displayPhone}`}
                    className="hover:text-[#00a86b] transition-colors"
                    style={{ color: footerTextColor || '#444444' }}
                  >
                    {displayPhone}
                  </a>
                </div>
              )}

              {footerBadgeText && (
                <div className="pt-2 flex flex-wrap items-center gap-2 text-[11.5px]">
                  <span className="inline-flex items-center gap-1 bg-emerald-50/70 text-[#00a86b] border border-emerald-100 px-2.5 py-1 rounded-full font-medium">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {footerBadgeText}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Middle Horizontal Categories Strip */}
        {footerShowCategoriesStrip && (
          <div className="mt-9 pt-6 border-t border-stone-200/90 flex flex-wrap items-center gap-y-2 text-[13px]">
            <span className="font-medium mr-3" style={{ color: footerHeadingColor || '#e05246' }}>
              {footerCategoriesTitle || 'Kategorien :'}
            </span>
            <div className="flex flex-wrap items-center gap-y-1.5" style={{ color: footerTextColor || '#444444' }}>
              {bottomCategoryLinks.map((cat, idx) => (
                <React.Fragment key={cat.label}>
                  {idx > 0 && (
                    <span className="mx-3 h-3 w-px bg-stone-200 inline-block" aria-hidden="true" />
                  )}
                  <Link
                    href={cat.url}
                    className="hover:text-[#00a86b] transition-colors"
                  >
                    {cat.label}
                  </Link>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Copyright & Payment Badges Bar */}
      <div className="bg-[#f4f5f6] border-t border-stone-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12.5px] text-stone-700">
            {displayCopyright}
          </p>

          {/* Payment Method Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2" aria-label="Akzeptierte Zahlungsarten">
            {footerPaymentVisa !== false && (
              <span className="inline-flex items-center justify-center h-[24px] w-[38px] bg-white border border-stone-200/90 rounded-[3px] shadow-2xs">
                <span className="text-[10px] font-black italic tracking-tight text-[#1a1f71]">VISA</span>
              </span>
            )}

            {footerPaymentCb !== false && (
              <span className="inline-flex items-center justify-center h-[24px] w-[38px] rounded-[3px] shadow-2xs bg-gradient-to-br from-[#007a3d] via-[#00826b] to-[#0055a4]">
                <span className="text-[11px] font-black tracking-tighter text-white">CB</span>
              </span>
            )}

            {footerPaymentAmex !== false && (
              <span className="inline-flex items-center justify-center h-[24px] w-[38px] rounded-[3px] shadow-2xs bg-[#2e77bc]">
                <span className="text-[6.5px] font-extrabold leading-[1.05] text-white text-center tracking-tight">
                  AMERICAN<br />EXPRESS
                </span>
              </span>
            )}

            {footerPaymentMaestro !== false && (
              <span className="inline-flex items-center justify-center h-[24px] w-[38px] rounded-[3px] shadow-2xs bg-[#0066b2] relative overflow-hidden">
                <span className="w-3.5 h-3.5 rounded-full bg-[#eb001b] inline-block -mr-1.5 opacity-95" />
                <span className="w-3.5 h-3.5 rounded-full bg-[#00a2e5] inline-block opacity-95" />
              </span>
            )}

            {footerPaymentMastercard !== false && (
              <span className="inline-flex items-center justify-center h-[24px] w-[38px] rounded-[3px] shadow-2xs bg-[#1f2937] relative overflow-hidden">
                <span className="w-3.5 h-3.5 rounded-full bg-[#eb001b] inline-block -mr-1.5 opacity-95" />
                <span className="w-3.5 h-3.5 rounded-full bg-[#f79e1b] inline-block opacity-95" />
              </span>
            )}

            {footerPaymentPaypal !== false && (
              <span className="inline-flex items-center justify-center h-[24px] w-[42px] bg-white border border-stone-200/90 rounded-[3px] shadow-2xs">
                <span className="text-[9.5px] font-extrabold italic tracking-tight">
                  <span className="text-[#003087]">Pay</span>
                  <span className="text-[#009cde]">Pal</span>
                </span>
              </span>
            )}

            {footerPaymentApplePay && (
              <span className="inline-flex items-center justify-center h-[24px] w-[38px] bg-black text-white rounded-[3px] shadow-2xs text-[9px] font-bold">
                Pay
              </span>
            )}

            {footerPaymentGooglePay && (
              <span className="inline-flex items-center justify-center h-[24px] w-[38px] bg-white border border-stone-200/90 rounded-[3px] shadow-2xs text-[9px] font-bold text-stone-700">
                GPay
              </span>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
