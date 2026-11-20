'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import HeroPreviewEditButton from '@/components/admin/HeroPreviewEditButton';
import { basicSanitizeHtml } from '@/lib/security';

interface CategoryItem {
  name: string;
  slug: string;
  href?: string;
}

interface HeroSlide {
  image: string;
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
}

const defaultGardenCategories: CategoryItem[] = [
  { name: 'Rasentraktoren', slug: 'rasentraktoren' },
  { name: 'Mähroboter', slug: 'maehroboter' },
  { name: 'Rasenmäher', slug: 'rasenmaeher' },
  { name: 'Kettensäge & Rasentrimmer', slug: 'kettensaege-rasentrimmer' },
  { name: 'Hochlader', slug: 'hochlader' },
  { name: 'Zubehör', slug: 'zubehoer' },
  { name: 'Zubehör für Gartengeräte', slug: 'zubehoer-fuer-gartengeraete' },
];

export interface HlgHeroProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config?: Record<string, any>;
  categories?: Array<{ id?: string; name: string; slug: string | null }>;
  isPreview?: boolean;
  sectionId?: string;
}

function parseNumberSetting(
  value: unknown,
  fallback: number,
  min?: number,
  max?: number
): number {
  if (value === undefined || value === null || value === '') return fallback;
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  let result = num;
  if (min !== undefined && result < min) result = min;
  if (max !== undefined && result > max) result = max;
  return result;
}

function parseColorSetting(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function stripHtmlTags(text: string): string {
  return String(text).replace(/<[^>]*>/g, '').trim();
}

function renderRichText(text: string): React.ReactNode {
  if (!/<\/?[a-z][\s\S]*>/i.test(text)) {
    return text;
  }
  return (
    <span
      className="contents"
      dangerouslySetInnerHTML={{ __html: basicSanitizeHtml(text) }}
    />
  );
}

export default function HlgHero({
  config = {},
  categories = [],
  isPreview = false,
  sectionId,
}: HlgHeroProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const cartStore = useCartStore();
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const cartItems = cartStore.getTotalItems();
  const cartTotal = cartStore.getTotalPrice();

  // Global Hero settings
  const heroMinHeight = parseNumberSetting(config?.heroMinHeight, 445, 280, 760);
  const heroPaddingY = parseNumberSetting(config?.heroPaddingY, 12, 0, 80);
  const heroGap = parseNumberSetting(config?.heroGap, 24, 0, 64);
  const heroBgColor = parseColorSetting(config?.heroBgColor, '#ffffff');
  const showMiniCart = config?.showMiniCart === true;
  const showMobileCategories = config?.showMobileCategories !== false;

  // Block 1 settings (Left Categories Sidebar)
  const block1MaxItems = parseNumberSetting(config?.block1MaxItems, 7, 3, 12);
  const block1BgColor = parseColorSetting(config?.block1BgColor, '#ffffff');
  const block1BorderColor = parseColorSetting(config?.block1BorderColor, '#e5e7eb');
  const block1BorderRadius = parseNumberSetting(config?.block1BorderRadius, 5, 0, 24);
  const block1TextColor = parseColorSetting(config?.block1TextColor, '#374151');
  const block1TextSize = parseNumberSetting(config?.block1TextSize, 13.5, 11, 20);

  const filteredDbCategories = (categories || []).filter((c) => {
    const slugLower = (c.slug || '').toLowerCase();
    const nameLower = c.name.toLowerCase();
    return slugLower !== 'uncategorized' && nameLower !== 'uncategorized' && nameLower !== 'allgemein';
  });

  const displayCategories: CategoryItem[] = [
    { name: 'Startseite', slug: '', href: '/' },
    ...(filteredDbCategories.length > 0
      ? filteredDbCategories.slice(0, block1MaxItems).map((c) => ({
          name: c.name,
          slug: c.slug || '',
        }))
      : defaultGardenCategories.slice(0, block1MaxItems)),
  ];

  // Block 2 settings (Hero Banner Slider)
  const customImage =
    config?.bannerImage &&
    config.bannerImage !== '/images/hero-appliances.jpg'
      ? config.bannerImage
      : config?.bgImageUrl &&
          config.bgImageUrl !== '/images/hero-appliances.jpg'
        ? config.bgImageUrl
        : '/images/hero-garden-mower.jpg';

  const primaryTitle =
    config?.title && !String(config.title).includes('Haushaltsgeräte')
      ? config.title
      : 'Rasenmäher im Angebot';

  const primarySubtitle =
    config?.subtitle && !String(config.subtitle).includes('Küche & Haushalt')
      ? config.subtitle
      : 'Pflegen Sie Ihren Garten, ohne viel auszugeben!';

  const primaryDescription =
    config?.description && !String(config.description).includes('Küche & Haushalt')
      ? config.description
      : 'Leistung, Qualität, unschlagbare Preise\nTreffen Sie die richtige Wahl!';

  const primaryCtaText = config?.ctaText ?? config?.buttonText ?? 'Angebote ansehen';
  const primaryCtaUrl = config?.ctaUrl ?? config?.buttonLink ?? '/shop';

  const block2BorderRadius = parseNumberSetting(config?.block2BorderRadius, 5, 0, 24);
  const block2BtnBg = parseColorSetting(config?.block2BtnBg, '#ef3e2d');
  const block2BtnTextColor = parseColorSetting(config?.block2BtnTextColor, '#ffffff');

  // Block 3 settings (Slide 2 Banner)
  const rawSideImage =
    typeof config?.sideCardImage === 'string' && config.sideCardImage.trim().length > 0
      ? config.sideCardImage.trim()
      : typeof config?.showcaseBgImage === 'string' && config.showcaseBgImage.trim().length > 0
        ? config.showcaseBgImage.trim()
        : '';
  const slide2Image =
    rawSideImage && rawSideImage !== '/images/hero-coffee-machine.jpg'
      ? rawSideImage
      : '/images/hero-robot-mower.jpg';

  const slide2Title =
    config?.sideCardTitle && !String(config.sideCardTitle).includes('Kaffeevollautomaten')
      ? config.sideCardTitle
      : 'Mähroboter & Gartentechnik';

  const slide2Subtitle =
    config?.sideCardCategory && !String(config.sideCardCategory).includes('Genuss auf Knopfdruck')
      ? config.sideCardCategory
      : 'Perfekter Rasen – vollautomatisch und leise!';

  const slide2Description =
    config?.sideCardSubtitle && !String(config.sideCardSubtitle).includes('Barista-Kaffee')
      ? config.sideCardSubtitle
      : 'Top-Marken, 2 Jahre Garantie & schneller Versand\nJetzt attraktive Saisonangebote entdecken!';

  const slide2CtaText =
    config?.sideCardCtaText && !String(config.sideCardCtaText).includes('Geräte entdecken')
      ? config.sideCardCtaText
      : 'Jetzt entdecken';

  const slide2CtaUrl =
    config?.sideCardUrl && !String(config.sideCardUrl).includes('kaffeemaschinen')
      ? config.sideCardUrl
      : '/shop?category=maehroboter';

  const slides: HeroSlide[] = [
    {
      image: customImage,
      title: primaryTitle,
      subtitle: primarySubtitle,
      description: primaryDescription,
      ctaText: primaryCtaText,
      ctaUrl: primaryCtaUrl,
    },
    {
      image: slide2Image,
      title: slide2Title,
      subtitle: slide2Subtitle,
      description: slide2Description,
      ctaText: slide2CtaText,
      ctaUrl: slide2CtaUrl,
    },
  ];

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  const currentSlide = slides[activeSlide] || slides[0];

  const previewRing = isPreview
    ? 'hover:ring-2 hover:ring-[#00a86b]/80 transition-shadow duration-200'
    : '';

  return (
    <section
      style={{
        paddingTop: `${heroPaddingY}px`,
        paddingBottom: `${heroPaddingY + 16}px`,
        backgroundColor: heroBgColor,
      }}
      className="relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Optional Floating Mini-Cart Widget (only when explicitly enabled) */}
        {showMiniCart && !isPreview && (
          <div className="hidden lg:block fixed right-0 top-1/2 -translate-y-1/2 z-40">
            <button
              type="button"
              onClick={() => cartStore.setIsOpen(true)}
              className="bg-[#00a86b] hover:bg-[#008f5a] text-white shadow-lg hover:shadow-xl rounded-l-2xl rounded-r-none px-3.5 py-3.5 sm:px-4 sm:py-4 flex flex-col items-center justify-center gap-2 transition-all group cursor-pointer"
              title="Warenkorb ansehen"
              aria-label="Warenkorb ansehen"
            >
              <svg
                className="w-6 h-6 text-white group-hover:scale-105 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M7 9l2.2-4.5M17 9l-2.2-4.5M4.5 9h15a1.5 1.5 0 011.45 1.88l-1.35 5.4A2.5 2.5 0 0117.17 18.2H6.83a2.5 2.5 0 01-2.43-1.92l-1.35-5.4A1.5 1.5 0 014.5 9zM9.2 12.5h5.6M10.7 15h2.6"
                />
              </svg>
              <span className="text-[12px] font-medium tracking-tight leading-none whitespace-nowrap">
                {mounted ? cartItems : 0} {mounted && cartItems > 1 ? 'Produkte' : 'Produkt'}
              </span>
              <span className="bg-white/25 text-white text-[12px] font-semibold px-3 py-1 rounded-full leading-tight tabular-nums whitespace-nowrap">
                {mounted ? cartTotal.toFixed(2).replace('.', ',') : '0,00'} €
              </span>
            </button>
          </div>
        )}

        {/* Main 2-Column Layout: Left Category Sidebar (aligned with ZUM SHOP GEHEN) + Full-Width Hero Banner */}
        <div
          className="flex flex-col lg:flex-row items-stretch"
          style={{ gap: `${heroGap}px` }}
        >
          {/* 1. LEFT SIDEBAR: Categories Navigation Card */}
          <div
            className={`hidden lg:flex flex-col w-[254px] shrink-0 relative group/block ${previewRing}`}
            style={{ borderRadius: `${block1BorderRadius}px` }}
          >
            {isPreview && sectionId && (
              <HeroPreviewEditButton sectionId={sectionId} blockNum={1} label="Block 1: Kategorien" />
            )}

            <div
              className="h-full flex flex-col overflow-hidden border shadow-[0_2px_10px_-4px_rgba(15,23,42,0.07)]"
              style={{
                backgroundColor: block1BgColor,
                borderColor: block1BorderColor,
                borderRadius: `${block1BorderRadius}px`,
              }}
            >
              <nav
                aria-label="Kategorien"
                className="flex-1 flex flex-col divide-y divide-stone-100"
              >
                {displayCategories.map((cat, idx) => (
                  <Link
                    key={idx}
                    href={cat.href || `/shop?category=${encodeURIComponent(cat.slug)}`}
                    className="group/item relative flex items-center justify-between px-5 py-3.5 hover:bg-emerald-50/50 transition-all"
                  >
                    <span className="absolute left-0 inset-y-2 w-[3px] rounded-r bg-[#00a86b] opacity-0 group-hover/item:opacity-100 transition-opacity" aria-hidden="true" />
                    <span
                      className="truncate font-medium group-hover/item:text-[#00a86b] transition-colors"
                      style={{ color: block1TextColor, fontSize: `${block1TextSize}px` }}
                    >
                      {cat.name}
                    </span>
                    <svg
                      className="w-3.5 h-3.5 text-stone-300 group-hover/item:text-[#00a86b] group-hover/item:translate-x-0.5 transition-all shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* 2. RIGHT MAIN HERO BANNER SLIDER */}
          <div
            className={`flex-1 min-w-0 relative overflow-hidden shadow-sm border border-stone-200/70 flex items-center justify-end group/block ${previewRing}`}
            style={{
              minHeight: `${heroMinHeight}px`,
              borderRadius: `${block2BorderRadius}px`,
              backgroundColor: '#1f2937',
            }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {isPreview && sectionId && (
              <HeroPreviewEditButton
                sectionId={sectionId}
                blockNum={activeSlide === 0 ? 2 : 3}
                label={activeSlide === 0 ? 'Block 2: Folie 1' : 'Block 3: Folie 2'}
              />
            )}

            {/* Slide Background Images */}
            {slides.map((slide, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-opacity duration-700 ${
                  idx === activeSlide ? 'opacity-100 z-0' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                {idx === 0 && slide.image.includes('hero-garden-mower') ? (
                  <picture className="absolute inset-0 w-full h-full">
                    <source
                      type="image/webp"
                      media="(max-width: 768px)"
                      srcSet="/images/hero-garden-mower-mobile.webp"
                    />
                    <source
                      type="image/webp"
                      media="(min-width: 769px)"
                      srcSet="/images/hero-garden-mower.webp"
                    />
                    <source
                      type="image/jpeg"
                      media="(max-width: 768px)"
                      srcSet="/images/hero-garden-mower-mobile.jpg"
                    />
                    <img
                      src="/images/hero-garden-mower.jpg"
                      alt={stripHtmlTags(slide.title)}
                      fetchPriority="high"
                      loading="eager"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover object-center"
                    />
                  </picture>
                ) : idx === 1 && slide.image.includes('hero-robot-mower') ? (
                  <picture className="absolute inset-0 w-full h-full">
                    <source
                      type="image/webp"
                      media="(max-width: 768px)"
                      srcSet="/images/hero-robot-mower-mobile.webp"
                    />
                    <source
                      type="image/webp"
                      media="(min-width: 769px)"
                      srcSet="/images/hero-robot-mower.webp"
                    />
                    <img
                      src="/images/hero-robot-mower.jpg"
                      alt={stripHtmlTags(slide.title)}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover object-center"
                    />
                  </picture>
                ) : (
                  <Image
                    src={slide.image}
                    alt={stripHtmlTags(slide.title)}
                    fill
                    priority={idx === 0}
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    fetchPriority={idx === 0 ? 'high' : 'auto'}
                    sizes="(max-width: 1024px) 100vw, 960px"
                    quality={85}
                    className="object-cover object-center"
                  />
                )}
              </div>
            ))}

            {/* Right-side Readability Gradient Scrim */}
            <div
              className="absolute inset-0 z-[1] pointer-events-none"
              style={{
                background:
                  'linear-gradient(to left, rgba(15, 23, 42, 0.62) 0%, rgba(15, 23, 42, 0.36) 46%, rgba(15, 23, 42, 0.04) 100%)',
              }}
            />

            {/* Right-Aligned Overlay Copy & CTA (matching mockup) */}
            <div className="relative z-10 w-full max-w-[470px] px-6 py-10 sm:px-10 lg:pr-12 lg:pl-6 text-right flex flex-col items-end">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-[11px] font-semibold uppercase tracking-wider text-white mb-3.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00a86b]" aria-hidden="true" />
                <span>{activeSlide === 0 ? 'Saison-Highlights' : 'Premium Gartentechnik'}</span>
              </span>

              <h1 className="text-2xl sm:text-3xl lg:text-[36px] font-semibold text-white tracking-tight leading-tight drop-shadow-sm">
                {renderRichText(currentSlide.title)}
              </h1>

              {currentSlide.subtitle && (
                <p className="mt-3.5 text-sm sm:text-base font-semibold text-white leading-snug max-w-[350px] drop-shadow-xs">
                  {renderRichText(currentSlide.subtitle)}
                </p>
              )}

              {currentSlide.description && (
                <p className="mt-2.5 text-xs sm:text-[13.5px] font-normal text-white/90 leading-relaxed whitespace-pre-line max-w-[360px] drop-shadow-xs">
                  {renderRichText(currentSlide.description)}
                </p>
              )}

              {currentSlide.ctaText && (
                <div className="mt-6">
                  <Link
                    href={currentSlide.ctaUrl || '/shop'}
                    className="inline-flex items-center justify-center gap-2 font-semibold text-sm px-7 py-3 rounded-[5px] shadow-md hover:shadow-xl transition-all hover:brightness-95 active:scale-[0.98]"
                    style={{
                      backgroundColor: block2BtnBg,
                      color: block2BtnTextColor,
                    }}
                  >
                    <span>{renderRichText(currentSlide.ctaText)}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
              )}
            </div>

            {/* Subtle Prev/Next Arrows on Hover */}
            {slides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length)}
                  aria-label="Vorherige Folie"
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center opacity-0 group-hover/block:opacity-100 transition-opacity cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSlide((prev) => (prev + 1) % slides.length)}
                  aria-label="Nächste Folie"
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center opacity-0 group-hover/block:opacity-100 transition-opacity cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Bottom Center Square Pagination Dots (matching mockup) */}
            {slides.length > 1 && (
              <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    aria-label={`Folie ${idx + 1}`}
                    className={`w-2.5 h-2.5 rounded-[2px] transition-all cursor-pointer ${
                      idx === activeSlide
                        ? 'bg-stone-700/90 ring-1 ring-white/70 scale-110'
                        : 'bg-stone-300/80 hover:bg-white'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile/Tablet Category Quick Carousel */}
        {showMobileCategories && (
          <div className="mt-4 lg:hidden">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {displayCategories.map((cat, idx) => (
                <Link
                  key={idx}
                  href={cat.href || `/shop?category=${encodeURIComponent(cat.slug)}`}
                  className="bg-white border border-stone-200 text-stone-700 hover:border-[#00a86b] hover:text-[#00a86b] text-xs font-medium px-3.5 py-2 rounded-full whitespace-nowrap shadow-2xs transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
