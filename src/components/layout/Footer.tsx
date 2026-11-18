'use client';

import React, { useState } from 'react';
import Link from 'next/link';

type FooterProps = {
  supportPhone?: string;
  supportEmail?: string;
  footerBgColor?: string;
  footerTextColor?: string;
  footerHeadingColor?: string;
  footerAddress1?: string;
  footerAddress2?: string;
  footerLocationsTitle?: string;
  footerNewsletterTitle?: string;
  footerNewsletterText?: string;
  footerNewsletterPlaceholder?: string;
  footerCallUsText?: string;
  footerCopyright?: string;
  footerSocialFacebook?: string;
  footerSocialTwitter?: string;
  footerSocialInstagram?: string;
  footerSocialLinkedin?: string;
  footerColumns?: Array<{ title: string; links: Array<{ label: string; url: string }> }>;
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

export default function Footer({
  supportEmail = 'kontakt@topgartengeraete.de',
  footerAddress1 = 'Rosenstraße 19, 26529 Marienhafe, Deutschland',
  footerCopyright = '© 2026 TOP GARTENGERÄTE',
  categories = [],
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

  const displayCopyright =
    footerCopyright &&
    !footerCopyright.includes('HLG') &&
    !footerCopyright.includes('Silva Dias')
      ? footerCopyright
      : '© 2026 TOP GARTENGERÄTE';

  const legalLinks = [
    { label: 'AGB', url: '/agb' },
    { label: 'Impressum', url: '/impressum' },
    { label: 'Über uns', url: '/ueber-uns' },
    { label: 'Datenschutzrichtlinie', url: '/datenschutz' },
    { label: 'Kontakt', url: `/${contactSlug}` },
  ];

  const quickLinks = [
    { label: 'Versandpolitik', url: '/lieferzeiten' },
    { label: 'Rückgabe & Rückerstattung', url: '/rueckgabe-und-erstattung' },
    { label: 'Zahlungsart', url: '/zahlungsinformationen' },
    { label: 'Cookie-Richtlinie', url: '/cookie-richtlinie' },
    { label: 'Widerrufsbelehrung', url: '/widerrufsbelehrung' },
  ];

  const customerLinks = [
    { label: 'Warenkorb', url: '/cart' },
    { label: 'Checkout', url: '/checkout' },
    { label: 'Wunschliste', url: '/wishlist' },
  ];

  const catalogLinks = [
    { label: 'Akku-Rasenmäher', url: '/shop?category=akku-rasenmaeher' },
    { label: 'Benzin-Rasenmäher', url: '/shop?category=benzin-rasenmaeher' },
    { label: 'Rasentraktoren', url: '/shop?category=rasentraktoren' },
    { label: 'Mähroboter', url: '/shop?category=maehroboter' },
    { label: 'Kettensäge & Rasentrimmer', url: '/shop?category=kettensaege-rasentrimmer' },
  ];

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

  const linkColumns = [
    { id: 'rechtliches', title: 'Rechtliches', links: legalLinks },
    { id: 'schnelle-links', title: 'Schnelle Links', links: quickLinks },
    { id: 'kunden', title: 'Kunden', links: customerLinks },
    { id: 'katalog', title: 'Katalog', links: catalogLinks },
  ];

  return (
    <footer className="font-sans bg-white border-t border-stone-100 mt-auto pb-16 lg:pb-0">
      {/* Main 5-Column Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Columns 1–4: Link Lists */}
          {linkColumns.map((col) => {
            const isOpen = openSection === col.id;
            return (
              <div key={col.id} className="lg:col-span-2">
                {/* Mobile Accordion Trigger */}
                <button
                  type="button"
                  onClick={() => toggleSection(col.id)}
                  className="w-full flex items-center justify-between md:hidden py-2 border-b border-stone-100 text-left cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="text-[14.5px] font-medium text-[#e05246]">{col.title}</span>
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
                <h3 className="hidden md:block text-[14.5px] font-medium text-[#e05246] mb-3.5">
                  {col.title}
                </h3>

                <ul className={`space-y-2.5 text-[13px] text-stone-700 mt-2.5 md:mt-0 ${isOpen ? 'block' : 'hidden md:block'}`}>
                  {col.links.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.url}
                        className="hover:text-[#00a86b] transition-colors inline-block"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {/* Column 5: Kontaktinformationen */}
          <div className="lg:col-span-4">
            <h3 className="text-[14.5px] font-medium text-[#e05246] mb-3.5">
              Kontaktinformationen
            </h3>

            <div className="space-y-3 text-[13px] text-stone-700">
              <div className="flex items-start gap-2.5">
                <svg
                  className="w-4 h-4 text-stone-600 shrink-0 mt-0.5"
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

              <div className="flex items-center gap-2.5">
                <svg
                  className="w-4 h-4 text-stone-600 shrink-0"
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
                >
                  {displayEmail}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Horizontal Categories Strip */}
        <div className="mt-9 pt-6 border-t border-stone-200/90 flex flex-wrap items-center gap-y-2 text-[13px]">
          <span className="text-[#e05246] font-medium mr-3">Kategorien :</span>
          <div className="flex flex-wrap items-center gap-y-1.5 text-stone-700">
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
      </div>

      {/* Bottom Copyright & Payment Badges Bar */}
      <div className="bg-[#f4f5f6] border-t border-stone-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12.5px] text-stone-700">
            {displayCopyright}
          </p>

          {/* Payment Method Badges: VISA, CB, AMEX, Maestro, MasterCard, PayPal */}
          <div className="flex flex-wrap items-center justify-center gap-2" aria-label="Akzeptierte Zahlungsarten">
            {/* VISA */}
            <span className="inline-flex items-center justify-center h-[24px] w-[38px] bg-white border border-stone-200/90 rounded-[3px] shadow-2xs">
              <span className="text-[10px] font-black italic tracking-tight text-[#1a1f71]">VISA</span>
            </span>

            {/* CB */}
            <span className="inline-flex items-center justify-center h-[24px] w-[38px] rounded-[3px] shadow-2xs bg-gradient-to-br from-[#007a3d] via-[#00826b] to-[#0055a4]">
              <span className="text-[11px] font-black tracking-tighter text-white">CB</span>
            </span>

            {/* American Express */}
            <span className="inline-flex items-center justify-center h-[24px] w-[38px] rounded-[3px] shadow-2xs bg-[#2e77bc]">
              <span className="text-[6.5px] font-extrabold leading-[1.05] text-white text-center tracking-tight">
                AMERICAN<br />EXPRESS
              </span>
            </span>

            {/* Maestro */}
            <span className="inline-flex items-center justify-center h-[24px] w-[38px] rounded-[3px] shadow-2xs bg-[#0066b2] relative overflow-hidden">
              <span className="w-3.5 h-3.5 rounded-full bg-[#eb001b] inline-block -mr-1.5 opacity-95" />
              <span className="w-3.5 h-3.5 rounded-full bg-[#00a2e5] inline-block opacity-95" />
            </span>

            {/* MasterCard */}
            <span className="inline-flex items-center justify-center h-[24px] w-[38px] rounded-[3px] shadow-2xs bg-[#1f2937] relative overflow-hidden">
              <span className="w-3.5 h-3.5 rounded-full bg-[#eb001b] inline-block -mr-1.5 opacity-95" />
              <span className="w-3.5 h-3.5 rounded-full bg-[#f79e1b] inline-block opacity-95" />
            </span>

            {/* PayPal */}
            <span className="inline-flex items-center justify-center h-[24px] w-[42px] bg-white border border-stone-200/90 rounded-[3px] shadow-2xs">
              <span className="text-[9.5px] font-extrabold italic tracking-tight">
                <span className="text-[#003087]">Pay</span>
                <span className="text-[#009cde]">Pal</span>
              </span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
