import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import prisma from "@/lib/prisma";
import CurrencyProvider from "@/components/CurrencyProvider";
import { defaultCurrencyOptions, type CurrencyOptions } from "@/lib/formatPrice";
import DeferredWidgets from "@/components/layout/DeferredWidgets";
import StoreLayout from "@/components/layout/StoreLayout";
import ThemeProvider from "@/components/layout/ThemeProvider";
import ZoomController from "@/components/layout/ZoomController";
import GoogleAnalytics from '@/components/layout/GoogleAnalytics';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import { PostHogProvider } from '@/components/providers/PostHogProvider';
import { Toaster } from 'react-hot-toast';
import { getCachedSettings, getCachedCategoriesTree, getCachedProductCounts } from '@/lib/cache';
import { safeJsonLd } from '@/lib/security';
import { SITE_URL } from '@/lib/site';
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
});

const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Top Gartengeräte";

export async function generateMetadata(): Promise<Metadata> {
  const settingsMap = await getCachedSettings();
  const faviconUrl = settingsMap['FAVICON_IMAGE'] || '/logo-top-gartengeraete-dark.svg';
  const title = settingsMap['HOME_META_TITLE'] || `${storeName} | Hochwertige Gartengeräte zu besten Preisen`;
  const description = settingsMap['HOME_META_DESCRIPTION'] || "Entdecken Sie hochwertige Gartengeräte zu den besten Preisen bei Top Gartengeräte. Rasenmäher, Mähroboter, Motorsägen, Heckenscheren, Hochdruckreiniger und mehr.";
  const ogImage = settingsMap['OG_IMAGE'] || settingsMap['HEADER_LOGO_IMAGE'] || '/logo-top-gartengeraete-dark.svg';

  const rawGsc = (settingsMap['GOOGLE_SITE_VERIFICATION'] || '').trim();
  const gscToken = rawGsc.match(/content=["']([^"']+)["']/i)?.[1]?.trim()
    || rawGsc.match(/google-site-verification=([^"'\s&]+)/i)?.[1]?.trim()
    || rawGsc.replace(/^["']|["']$/g, '').trim();

  const rawBing = (settingsMap['BING_SITE_VERIFICATION'] || '').trim();
  const bingToken = rawBing.match(/content=["']([^"']+)["']/i)?.[1]?.trim()
    || rawBing.replace(/^["']|["']$/g, '').trim();

  const baseUrl = SITE_URL;

  return {
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: '/',
    },
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      url: baseUrl,
      siteName: storeName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${storeName} preview`,
        }
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [ogImage],
    },
    icons: faviconUrl ? {
      icon: [
        { url: faviconUrl },
        { url: faviconUrl, type: 'image/png' },
        { url: faviconUrl, type: 'image/x-icon' },
      ],
      shortcut: [faviconUrl],
      apple: [
        { url: faviconUrl },
      ],
    } : undefined,
    verification: (gscToken || bingToken) ? {
      ...(gscToken ? { google: gscToken } : {}),
      ...(bingToken ? { other: { 'msvalidate.01': [bingToken] } } : {})
    } : undefined
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const messages = await getMessages();
  const locale = await getLocale();

  const userRole: 'ADMIN' | 'CUSTOMER' | null = null;

  const settingsMap = await getCachedSettings();

  const currencyOptions: CurrencyOptions = {
    currencySymbol: settingsMap.currencySymbol || defaultCurrencyOptions.currencySymbol,
    currencyPosition: (settingsMap.currencyPosition as CurrencyOptions['currencyPosition']) || defaultCurrencyOptions.currencyPosition,
    thousandSeparator: settingsMap.thousandSeparator !== undefined ? settingsMap.thousandSeparator : defaultCurrencyOptions.thousandSeparator,
    decimalSeparator: settingsMap.decimalSeparator || defaultCurrencyOptions.decimalSeparator,
    taxIncludedInPrice: settingsMap.TAX_INCLUDED_IN_PRICE !== 'false',
    defaultVatRate: Number(settingsMap.DEFAULT_VAT_RATE) || 19,
  };
  const contactSlug = settingsMap.CONTACT_SLUG || 'kontakt';
  const defaultMenuLinks = [
    { label: 'AGB', url: '/agb' },
    { label: 'ZAHLUNGSART', url: '/zahlungsinformationen' },
    { label: 'ÜBER UNS', url: '/ueber-uns' },
    { label: 'KONTAKT', url: `/${contactSlug}` },
    { label: 'BLOG', url: '/blog' },
    { label: 'BESTELLUNG VERFOLGEN', url: '/order-tracking' },
  ];

  let menuLinks = defaultMenuLinks;
  try {
    if (settingsMap.HEADER_MENU_LINKS) {
      const parsed = JSON.parse(settingsMap.HEADER_MENU_LINKS);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const isOldDefault = parsed.length === 4 && parsed[0]?.label === 'Startseite' && parsed[1]?.label === 'Shop';
        if (!isOldDefault) {
          menuLinks = parsed;
        }
      }
    }
  } catch (e) {
    console.error("Erreur parsing HEADER_MENU_LINKS", e);
  }

  const defaultFooterColumns = [
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
  let footerColumns = defaultFooterColumns;
  try {
    if (settingsMap.FOOTER_COLUMNS) {
      const parsed = JSON.parse(settingsMap.FOOTER_COLUMNS);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const isOld = parsed.length === 2 && parsed[0]?.title === 'Kundenservice' && parsed[1]?.title === 'Mein Konto';
        if (!isOld) {
          footerColumns = parsed;
        }
      }
    }
  } catch { }

  const defaultTopBarLinks = [
    { label: 'AGB', url: '/agb' },
    { label: 'Blog', url: '/blog' },
    { label: 'Versand', url: '/lieferzeiten' },
    { label: 'Widerrufsbelehrung', url: '/widerrufsbelehrung' },
  ];
  let topBarLinks = defaultTopBarLinks;
  try {
    if (settingsMap.TOP_BAR_LINKS) {
      const parsed = JSON.parse(settingsMap.TOP_BAR_LINKS);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const isOld = parsed.length === 1 && parsed[0]?.icon === 'truck';
        if (!isOld) {
          topBarLinks = parsed;
        }
      }
    }
  } catch { }

  const { newCount: newProductsCount, hotCount: hotProductsCount, saleCount: saleProductsCount } = await getCachedProductCounts();

  const storeSettings = {
    announcement: settingsMap.HEADER_ANNOUNCEMENT_TEXT || settingsMap.HEADER_ANNOUNCEMENT || 'Willkommen bei Top Gartengeräte • Kostenloser Versand ab 200 € • 2 Jahre Garantie',
    logoImage: settingsMap.HEADER_LOGO_IMAGE && settingsMap.HEADER_LOGO_IMAGE !== '/logo.png' && settingsMap.HEADER_LOGO_IMAGE !== '/logo.jpg' && settingsMap.HEADER_LOGO_IMAGE !== '/LOGO-HLG-HAUSGERAETE.png' ? settingsMap.HEADER_LOGO_IMAGE : '/logo-top-gartengeraete-dark.svg',
    headerShopBtnText: settingsMap.HEADER_SHOP_BTN_TEXT || 'ZUM SHOP GEHEN',
    supportPhone: settingsMap.FOOTER_SUPPORT_PHONE ?? settingsMap.HEADER_SUPPORT_PHONE ?? '',
    supportEmail: settingsMap.FOOTER_SUPPORT_EMAIL ?? settingsMap.HEADER_SUPPORT_EMAIL ?? 'kontakt@topgartengeraete.de',
    menuLinks: menuLinks,
    topBarLinks: topBarLinks,
    loginText: settingsMap.LOGIN_TEXT || 'Anmelden',
    myAccountText: settingsMap.MY_ACCOUNT_TEXT || 'Mein Konto',
    adminDashboardText: settingsMap.ADMIN_DASHBOARD_TEXT || 'Admin-Dashboard',
    topBarBgColor: settingsMap.TOP_BAR_BG_COLOR || '#ffffff',
    topBarTextColor: settingsMap.TOP_BAR_TEXT_COLOR || '#4b5563',
    footerBgColor: (settingsMap.FOOTER_BG_COLOR && settingsMap.FOOTER_BG_COLOR !== '#0B162C' && settingsMap.FOOTER_BG_COLOR !== '#0f172a') ? settingsMap.FOOTER_BG_COLOR : '#ffffff',
    footerTextColor: (settingsMap.FOOTER_TEXT_COLOR && settingsMap.FOOTER_TEXT_COLOR !== '#d1d5db') ? settingsMap.FOOTER_TEXT_COLOR : '#374151',
    footerHeadingColor: (settingsMap.FOOTER_HEADING_COLOR && settingsMap.FOOTER_HEADING_COLOR !== '#ffffff') ? settingsMap.FOOTER_HEADING_COLOR : '#e05246',
    footerAccentColor: settingsMap.FOOTER_ACCENT_COLOR || '#00a86b',
    footerAddress1: settingsMap.FOOTER_ADDRESS_1 ?? 'Rosenstraße 19, 26529 Marienhafe, Deutschland',
    footerAddress2: settingsMap.FOOTER_ADDRESS_2 ?? 'Zuverlässige Lieferung direkt zu Ihnen nach Hause',
    footerLocationsTitle: settingsMap.FOOTER_LOCATIONS_TITLE || 'Standort & Liefergebiet',
    footerContactTitle: settingsMap.FOOTER_CONTACT_TITLE || 'Kontaktinformationen',
    footerBadgeText: settingsMap.FOOTER_BADGE_TEXT || 'Geprüfte Fachhändler-Qualität',
    footerShowCategoriesStrip: settingsMap.FOOTER_SHOW_CATEGORIES_STRIP !== 'false',
    footerCategoriesTitle: settingsMap.FOOTER_CATEGORIES_TITLE || 'Kategorien :',
    footerNewsletterTitle: settingsMap.FOOTER_NEWSLETTER_TITLE || 'Top Gartengeräte Newsletter',
    footerNewsletterText: settingsMap.FOOTER_NEWSLETTER_TEXT || 'Abonnieren Sie unseren Newsletter für exklusive Angebote und Gutscheine.',
    footerNewsletterPlaceholder: settingsMap.FOOTER_NEWSLETTER_PLACEHOLDER || 'Ihre E-Mail-Adresse...',
    footerCallUsText: settingsMap.FOOTER_CALL_US_TEXT || 'Kundenservice',
    footerCopyright: (settingsMap.FOOTER_COPYRIGHT && !settingsMap.FOOTER_COPYRIGHT.includes('HLG')) ? settingsMap.FOOTER_COPYRIGHT : `© 2026 TOP GARTENGERÄTE`,
    footerSocialFacebook: settingsMap.FOOTER_SOCIAL_FACEBOOK || '#',
    footerSocialTwitter: settingsMap.FOOTER_SOCIAL_TWITTER || '#',
    footerSocialInstagram: settingsMap.FOOTER_SOCIAL_INSTAGRAM || '#',
    footerSocialLinkedin: settingsMap.FOOTER_SOCIAL_LINKEDIN || '#',
    footerColumns: footerColumns,
    footerLogoImage: settingsMap.FOOTER_LOGO_IMAGE && settingsMap.FOOTER_LOGO_IMAGE !== '/LOGO-HLG-HAUSGERAETE.png' ? settingsMap.FOOTER_LOGO_IMAGE : '/logo-top-gartengeraete-dark.svg',
    footerDescription: settingsMap.FOOTER_DESCRIPTION || 'Top Gartengeräte ist Ihr zuverlässiger Fachhändler für hochwertige Gartengeräte. Entdecken Sie erstklassige Rasenmäher, Mähroboter, Motorsägen, Heckenscheren und Gartentechnik führender Marken zu Spitzenpreisen.',
    footerShowAddress: settingsMap.FOOTER_SHOW_ADDRESS !== 'false',
    footerShowEmail: settingsMap.FOOTER_SHOW_EMAIL !== 'false',
    footerShowPhone: settingsMap.FOOTER_SHOW_PHONE === 'true',
    footerPaymentAmex: settingsMap.FOOTER_PAYMENT_AMEX !== 'false',
    footerPaymentApplePay: settingsMap.FOOTER_PAYMENT_APPLE_PAY === 'true',
    footerPaymentGooglePay: settingsMap.FOOTER_PAYMENT_GOOGLE_PAY === 'true',
    footerPaymentMastercard: settingsMap.FOOTER_PAYMENT_MASTERCARD !== 'false',
    footerPaymentVisa: settingsMap.FOOTER_PAYMENT_VISA !== 'false',
    footerPaymentPaypal: settingsMap.FOOTER_PAYMENT_PAYPAL !== 'false',
    footerPaymentCb: settingsMap.FOOTER_PAYMENT_CB !== 'false',
    footerPaymentMaestro: settingsMap.FOOTER_PAYMENT_MAESTRO !== 'false',
    footerPaymentOpay: settingsMap.FOOTER_PAYMENT_OPAY !== 'false',
    categories: await getCachedCategoriesTree(),
    maintenanceMode: settingsMap.MAINTENANCE_MODE === 'true',
    maintenanceTitle: settingsMap.MAINTENANCE_TITLE || 'Geschäft in Wartung',
    maintenanceMessage: settingsMap.MAINTENANCE_MESSAGE || 'Wir aktualisieren derzeit unseren Katalog. Wir sind in Kürze wieder für Sie da!',
    maintenanceImage: settingsMap.MAINTENANCE_IMAGE || '',
    searchBorderColor: settingsMap.SEARCH_BORDER_COLOR || '#e5e7eb',
    searchPlaceholder: settingsMap.SEARCH_PLACEHOLDER || 'Produkte suchen...',
    searchBtnText: settingsMap.SEARCH_BTN_TEXT || 'Suche',
    searchBtnBgColor: settingsMap.SEARCH_BTN_BG_COLOR || '#00a86b',
    searchBtnTextColor: settingsMap.SEARCH_BTN_TEXT_COLOR || '#ffffff',
    showNew: newProductsCount > 0,
    showHot: hotProductsCount >= 3,
    showSale: saleProductsCount > 0,
    mobileAboutTitle: settingsMap.MOBILE_ABOUT_TITLE || 'Top Gartengeräte',
    mobileAboutDesc: settingsMap.MOBILE_ABOUT_DESC || 'Ihre hochwertigen Gartengeräte zu den besten Preisen!',
    mobileMenuLinks: (() => {
      try {
        return settingsMap.MOBILE_MENU_LINKS ? JSON.parse(settingsMap.MOBILE_MENU_LINKS) : menuLinks;
      } catch {
        return menuLinks;
      }
    })(),
    mobileContactAddress: (
      (settingsMap.MOBILE_CONTACT_ADDRESS && !settingsMap.MOBILE_CONTACT_ADDRESS.includes('123 Main'))
        ? settingsMap.MOBILE_CONTACT_ADDRESS.trim()
        : (settingsMap.FOOTER_ADDRESS_1?.trim() || settingsMap.CONTACT_ADDRESS?.trim() || '')
    ),
    mobileContactPhone: (
      (settingsMap.MOBILE_CONTACT_PHONE && !settingsMap.MOBILE_CONTACT_PHONE.includes('123 456') && !settingsMap.MOBILE_CONTACT_PHONE.includes('253 000'))
        ? settingsMap.MOBILE_CONTACT_PHONE.trim()
        : (settingsMap.FOOTER_SUPPORT_PHONE?.trim() || settingsMap.HEADER_SUPPORT_PHONE?.trim() || settingsMap.CONTACT_PHONE?.trim() || '')
    ),
    mobileContactEmail: (
      (settingsMap.MOBILE_CONTACT_EMAIL && !settingsMap.MOBILE_CONTACT_EMAIL.includes('example.com'))
        ? settingsMap.MOBILE_CONTACT_EMAIL.trim()
        : (settingsMap.FOOTER_SUPPORT_EMAIL?.trim() || settingsMap.HEADER_SUPPORT_EMAIL?.trim() || settingsMap.CONTACT_EMAIL_DISPLAY?.trim() || '')
    ),
    mobileContactWebsite: settingsMap.MOBILE_CONTACT_WEBSITE && !settingsMap.MOBILE_CONTACT_WEBSITE.includes('example.com')
      ? settingsMap.MOBILE_CONTACT_WEBSITE
      : '',
    mobileHeaderBorderColor: settingsMap.MOBILE_HEADER_BORDER_COLOR || '#d1d5db',
    allCategoriesBgColor: settingsMap.ALL_CATEGORIES_BG_COLOR || '#111827', // text-gray-900 by default
    allCategoriesTextColor: settingsMap.ALL_CATEGORIES_TEXT_COLOR || '#ffffff', // text-white
    contactSlug: contactSlug,
  };

  const rawFont = settingsMap.GLOBAL_FONT_FAMILY || 'Inter';
  const globalFont = /^[A-Za-z0-9 \-]{1,50}$/.test(rawFont) ? rawFont : 'Inter';
  const fontUrl = `https://fonts.googleapis.com/css2?family=${globalFont.replace(/ /g, '+')}:wght@300;400;500;600;700;800&display=swap`;

  return (
    <html
      lang={locale}
      className={`${inter.variable} h-full antialiased`}
    >
      <head>
        <link rel="alternate" type="application/rss+xml" title={`${storeName} - Blog RSS`} href="/rss.xml" />
        {settingsMap.FAVICON_IMAGE && (
          <>
            <link rel="icon" href={settingsMap.FAVICON_IMAGE} />
            <link rel="shortcut icon" href={settingsMap.FAVICON_IMAGE} />
            <link rel="apple-touch-icon" href={settingsMap.FAVICON_IMAGE} />
          </>
        )}
        {globalFont !== 'Inter' && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href={fontUrl} rel="stylesheet" />
            <style>{`
              :root {
                --font-inter: '${globalFont}', sans-serif;
              }
              body, .font-sans {
                font-family: '${globalFont}', sans-serif !important;
              }
            `}</style>
          </>
        )}
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": storeName,
              "image": settingsMap.HEADER_LOGO_IMAGE || '/logo-top-gartengeraete-dark.svg',
              "url": SITE_URL,
              "telephone": settingsMap.FOOTER_SUPPORT_PHONE ?? settingsMap.HEADER_SUPPORT_PHONE,
              "email": settingsMap.FOOTER_SUPPORT_EMAIL ?? settingsMap.HEADER_SUPPORT_EMAIL ?? 'kontakt@topgartengeraete.de',
              "priceRange": "€€",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": settingsMap.FOOTER_ADDRESS_1 || 'Rosenstraße 19',
                "postalCode": "26529",
                "addressLocality": "Marienhafe",
                "addressCountry": settingsMap.STORE_COUNTRY || "DE"
              },
              "description": "Top Gartengeräte - Ihr Fachhändler für Gartengeräte, Rasenmäher, Mähroboter, Motorsägen, Heckenscheren und Gartentechnik."
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": storeName,
              "url": SITE_URL,
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": `${SITE_URL}/search?q={search_term_string}`
                },
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        <ThemeProvider themeColor={settingsMap.THEME_COLOR || '#00a86b'} />
        <ZoomController />
        <NextIntlClientProvider messages={messages} locale={locale}>
          <PostHogProvider>
            <CurrencyProvider options={currencyOptions}>
              <StoreLayout settings={storeSettings} userRole={userRole}>
                <Toaster position="bottom-right" />
                {children}
                <DeferredWidgets
                  chatEnabled={settingsMap.CHAT_ENABLED !== 'false'}
                  chatStoreName={settingsMap.CHAT_STORE_NAME || settingsMap.STORE_NAME || 'Top Gartengeräte'}
                  chatStoreIcon={settingsMap.CHAT_STORE_ICON || settingsMap.HEADER_LOGO_IMAGE || settingsMap.FAVICON_IMAGE || '/logo-top-gartengeraete-dark.svg'}
                />
              </StoreLayout>
            </CurrencyProvider>
          </PostHogProvider>
        </NextIntlClientProvider>
        <GoogleAnalytics gaId={settingsMap.GOOGLE_ANALYTICS_ID} />
      </body>
    </html>
  );
}
