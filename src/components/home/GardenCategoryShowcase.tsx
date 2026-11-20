'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Price from '@/components/Price';

export interface ShowcaseCatalogProduct {
  id: string;
  title: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  images?: string[];
  categorySlug?: string;
  categoryName?: string;
  allCategories?: string;
  rating?: number;
}

interface GardenCategoryShowcaseProps {
  catalogProducts?: ShowcaseCatalogProduct[];
  config?: Record<string, any>;
}

const DEFAULT_SIDEBAR_ITEMS: ShowcaseCatalogProduct[] = [
  {
    id: 'sb-1',
    title: 'AS-Motor AS 915 Sherpa 2WD Aufsitzmäher',
    slug: '',
    price: 8289,
    compareAtPrice: 9690.9,
    images: ['/images/hero-garden-mower.jpg'],
    rating: 0,
  },
  {
    id: 'sb-2',
    title: 'HUSQVARNA Mähroboter CEORA 546 EPOS',
    slug: '',
    price: 16890.89,
    compareAtPrice: 29999.99,
    images: ['/images/hero-robot-mower.jpg'],
    rating: 5,
  },
  {
    id: 'sb-3',
    title: 'HUSQVARNA Mähroboter Automower 550 EPOS',
    slug: '',
    price: 12999.99,
    compareAtPrice: 18000.9,
    images: ['/images/hero-robot-mower.jpg'],
    rating: 5,
  },
];

const DEFAULT_MAIN_ITEMS: ShowcaseCatalogProduct[] = [
  {
    id: 'tr-1',
    title: 'Ariens Null-Wendekreis Mäher Edge 34',
    slug: '',
    price: 3999.92,
    images: ['/images/hero-garden-mower.jpg'],
    rating: 4,
  },
  {
    id: 'tr-2',
    title: 'Stiga Akku-Rasentraktor Tornado 598e',
    slug: '',
    price: 4310,
    images: ['/images/hero-garden-mower.jpg'],
    rating: 5,
  },
  {
    id: 'tr-3',
    title: 'Texas Benzin-Rasentraktor Premium X',
    slug: '',
    price: 3429.8,
    images: ['/images/hero-garden-mower.jpg'],
    rating: 5,
  },
  {
    id: 'tr-4',
    title: 'Al-Ko Benzin-Rasentraktor Easy 15-93.2 HD-A',
    slug: '',
    price: 2004.9,
    images: ['/images/hero-garden-mower.jpg'],
    rating: 5,
  },
  {
    id: 'tr-5',
    title: 'Stiga Akku-Rasentraktor Estate 384e mit Fangkorb',
    slug: '',
    price: 2009.99,
    compareAtPrice: 3038,
    images: ['/images/hero-garden-mower.jpg'],
    rating: 5,
  },
  {
    id: 'tr-6',
    title: 'MTD Rasentraktor Smart RF 125',
    slug: '',
    price: 1310.84,
    compareAtPrice: 1859.9,
    images: ['/images/hero-garden-mower.jpg'],
    rating: 5,
  },
];

const DEFAULT_ROBOT_ITEMS: ShowcaseCatalogProduct[] = [
  {
    id: 'rb-1',
    title: 'HUSQVARNA 315 Mark II Automower®',
    slug: '',
    price: 1010.89,
    images: ['/images/hero-robot-mower.jpg'],
    rating: 5,
  },
  {
    id: 'rb-2',
    title: 'HONDA Mähroboter Miimo HRM 520',
    slug: '',
    price: 1296.82,
    images: ['/images/hero-robot-mower.jpg'],
    rating: 5,
  },
  {
    id: 'rb-3',
    title: 'HUSQVARNA 310 Mark II Automower®',
    slug: '',
    price: 710.45,
    images: ['/images/hero-robot-mower.jpg'],
    rating: 5,
  },
  {
    id: 'rb-4',
    title: 'HONDA Mähroboter Miimo HRM 3000',
    slug: '',
    price: 1488.9,
    images: ['/images/hero-robot-mower.jpg'],
    rating: 5,
  },
  {
    id: 'rb-5',
    title: 'HUSQVARNA Mähroboter CEORA 546 EPOS',
    slug: '',
    price: 16890.89,
    compareAtPrice: 29999.99,
    images: ['/images/hero-robot-mower.jpg'],
    rating: 5,
  },
  {
    id: 'rb-6',
    title: 'CUB CADET Mähroboter XR5 1000',
    slug: '',
    price: 707.82,
    images: ['/images/hero-robot-mower.jpg'],
    rating: 5,
  },
];

const DEFAULT_HOCHLADER_ITEMS: ShowcaseCatalogProduct[] = [
  {
    id: 'hl-1',
    title: 'STEMA® ALU SH O1 7.5-21-13.1 Aluminium Hochlader',
    slug: '',
    price: 1188.99,
    images: ['/images/hero-garden-mower.jpg'],
    rating: 0,
  },
  {
    id: 'hl-2',
    title: 'STEMA® SH O2 13-25-13.1 Hochlader mit Laubgitter',
    slug: '',
    price: 1729.84,
    images: ['/images/hero-garden-mower.jpg'],
    rating: 5,
  },
  {
    id: 'hl-3',
    title: 'STEMA® ALU SH O2 10-21-13.1 Aluminium Hochlader',
    slug: '',
    price: 1678.89,
    images: ['/images/hero-garden-mower.jpg'],
    rating: 0,
  },
  {
    id: 'hl-4',
    title: 'STEMA® SH O1 7.5-25-13.2 Hochlader Tandem',
    slug: '',
    price: 1596.77,
    images: ['/images/hero-garden-mower.jpg'],
    rating: 0,
  },
  {
    id: 'hl-5',
    title: 'STEMA® SH O2 20-25-13.2 Hochlader mit Laubgitter',
    slug: '',
    price: 2144.58,
    images: ['/images/hero-garden-mower.jpg'],
    rating: 0,
  },
  {
    id: 'hl-6',
    title: 'STEMA® SH O2 15-25-13.2 Hochlader mit Hochplane',
    slug: '',
    price: 2069.99,
    images: ['/images/hero-garden-mower.jpg'],
    rating: 0,
  },
];

function StarRow({ rating = 5, size = 'sm' }: { rating?: number; size?: 'xs' | 'sm' }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  const sizeClass = size === 'xs' ? 'w-3 h-3' : 'w-3.5 h-3.5';
  return (
    <div className="flex items-center gap-0.5" aria-label={`Bewertung ${filled} von 5 Sternen`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${sizeClass} ${star <= filled ? 'text-[#f5b400] fill-[#f5b400]' : 'text-[#f5b400] fill-none'
            }`}
          stroke="currentColor"
          strokeWidth={1.6}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
          />
        </svg>
      ))}
    </div>
  );
}

function matchesKeywords(product: ShowcaseCatalogProduct, keywords: string[]): boolean {
  const haystack = `${product.title} ${product.categoryName || ''} ${product.categorySlug || ''} ${product.allCategories || ''}`.toLowerCase();
  return keywords.some((kw) => haystack.includes(kw));
}

export default function GardenCategoryShowcase({
  catalogProducts = [],
  config = {},
}: GardenCategoryShowcaseProps) {
  const showSidebar = config?.showSidebar !== false;
  const showBanner = config?.showBanner !== false;
  const fallbackPreset: 'tractors' | 'robots' | 'hochlader' =
    config?.fallbackPreset === 'robots'
      ? 'robots'
      : config?.fallbackPreset === 'hochlader'
        ? 'hochlader'
        : 'tractors';

  const sidebarTitle = config?.sidebarTitle || 'Angebote Mähroboter';
  const sidebarKeywords: string[] = Array.isArray(config?.sidebarKeywords)
    ? config.sidebarKeywords
    : ['mähroboter', 'maehroboter', 'roboter', 'automower', 'navimow'];

  const bannerImage = config?.bannerImage || '/images/banner-robot-mower-wide.jpg';
  const bannerAlt = config?.bannerAlt || 'Mähroboter Angebote bei Top Gartengeräte';
  const bannerUrl = config?.bannerUrl || '/shop?category=maehroboter';

  const mainTitle =
    config?.title ||
    (fallbackPreset === 'robots'
      ? 'MÄHROBOTER'
      : fallbackPreset === 'hochlader'
        ? 'HOCHLADER'
        : 'UNSERE RASENTRAKTOREN');
  const mainLinkText = config?.linkText || 'Mehr anzeigen';
  const mainLinkUrl =
    config?.linkUrl ||
    (fallbackPreset === 'robots'
      ? '/shop?category=maehroboter'
      : fallbackPreset === 'hochlader'
        ? '/shop?category=hochlader'
        : '/shop?category=rasentraktoren');
  const mainKeywords: string[] = Array.isArray(config?.mainKeywords)
    ? config.mainKeywords
    : fallbackPreset === 'robots'
      ? ['mähroboter', 'maehroboter', 'automower', 'miimo', 'navimow', 'roboter']
      : fallbackPreset === 'hochlader'
        ? ['hochlader', 'stema', 'anhänger', 'anhaenger', 'kipper', 'tieflader']
        : ['rasentraktor', 'aufsitzmäher', 'aufsitzmaeher', 'traktor', 'wendekreis', 'rasenmäher'];

  // Resolve sidebar products from real DB catalog or fallbacks
  const sidebarProducts = useMemo(() => {
    if (catalogProducts && catalogProducts.length > 0) {
      const matched = catalogProducts.filter((p) => matchesKeywords(p, sidebarKeywords));
      const prioritized = matched.length > 0 ? matched : catalogProducts;
      const discounted = prioritized.filter(
        (p) => p.compareAtPrice && p.compareAtPrice > p.price
      );
      const rest = prioritized.filter(
        (p) => !(p.compareAtPrice && p.compareAtPrice > p.price)
      );
      return [...discounted, ...rest].slice(0, 3);
    }
    return DEFAULT_SIDEBAR_ITEMS;
  }, [catalogProducts, sidebarKeywords]);

  // Resolve 6 main grid products from real DB catalog or fallbacks
  const mainProducts = useMemo(() => {
    if (catalogProducts && catalogProducts.length > 0) {
      const matched = catalogProducts.filter((p) => matchesKeywords(p, mainKeywords));
      if (matched.length >= 6) {
        return matched.slice(0, 6);
      }
      const matchedIds = new Set(matched.map((p) => p.id));
      const extras = catalogProducts.filter((p) => !matchedIds.has(p.id));
      return [...matched, ...extras].slice(0, 6);
    }
    if (fallbackPreset === 'robots') return DEFAULT_ROBOT_ITEMS;
    if (fallbackPreset === 'hochlader') return DEFAULT_HOCHLADER_ITEMS;
    return DEFAULT_MAIN_ITEMS;
  }, [catalogProducts, mainKeywords, fallbackPreset]);

  return (
    <section className={`bg-white font-sans ${showSidebar || showBanner ? 'py-5 sm:py-7' : 'pb-6 pt-1'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-start gap-6">
          {/* LEFT COLUMN: Sidebar card or alignment spacer (exact 254px column) */}
          {showSidebar ? (
            <aside className="w-full lg:w-[254px] shrink-0 bg-[#f9f9fa] border border-stone-200/85 border-t-2 border-t-[#00a86b] rounded-[6px] p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
              <h2 className="text-[15.5px] font-semibold text-stone-800 pb-3 mb-3.5 border-b border-stone-200/70">
                {sidebarTitle}
              </h2>

              <div className="divide-y divide-stone-200/60">
                {sidebarProducts.map((product) => {
                  const href = product.slug ? `/produkt/${product.slug}` : '/shop?category=maehroboter';
                  const imageSrc = product.images?.[0] || '/images/hero-robot-mower.jpg';
                  return (
                    <Link
                      key={product.id}
                      href={href}
                      className="flex items-start gap-3 py-3 first:pt-0 last:pb-0 group"
                    >
                      <div className="w-[68px] h-[68px] shrink-0 bg-white border border-stone-200/80 rounded-[4px] p-1.5 flex items-center justify-center overflow-hidden group-hover:border-[#00a86b]/45 transition-colors">
                        <Image
                          src={imageSrc}
                          alt={product.title}
                          width={80}
                          height={80}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-[12.5px] font-medium text-stone-700 group-hover:text-[#00a86b] leading-snug line-clamp-2 transition-colors">
                          {product.title}
                        </h3>

                        <div className="mt-1.5">
                          <StarRow rating={product.rating ?? 5} size="xs" />
                        </div>

                        <div className="mt-1.5 flex flex-col leading-tight">
                          {product.compareAtPrice && product.compareAtPrice > product.price && (
                            <Price
                              amount={product.compareAtPrice}
                              showTax={false}
                              className="text-[11.5px] text-stone-400 line-through tabular-nums"
                            />
                          )}
                          <Price
                            amount={product.price}
                            showTax={false}
                            className="text-[14px] font-semibold text-[#e05246] tabular-nums mt-0.5"
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </aside>
          ) : (
            <div className="hidden lg:block w-[254px] shrink-0" aria-hidden="true" />
          )}

          {/* RIGHT COLUMN: Optional Wide Banner Strip + 2x3 Product Showcase Grid */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">
            {showBanner && (
              <Link
                href={bannerUrl}
                className="relative w-full h-[145px] sm:h-[175px] lg:h-[195px] rounded-[6px] overflow-hidden block group border border-stone-200/80 shadow-xs"
              >
                {bannerImage === '/images/banner-robot-mower-wide.jpg' ? (
                  <picture className="absolute inset-0 w-full h-full">
                    <source
                      type="image/webp"
                      media="(max-width: 768px)"
                      srcSet="/images/banner-robot-mower-wide-mobile.webp"
                    />
                    <source
                      type="image/webp"
                      media="(min-width: 769px)"
                      srcSet="/images/banner-robot-mower-wide.webp"
                    />
                    <img
                      src="/images/banner-robot-mower-wide.jpg"
                      alt={bannerAlt}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-700"
                    />
                  </picture>
                ) : (
                  <Image
                    src={bannerImage}
                    alt={bannerAlt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 960px"
                    className="object-cover object-center group-hover:scale-[1.03] transition-transform duration-700"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                <span className="absolute left-5 bottom-4 inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-xs text-stone-800 group-hover:bg-[#00a86b] group-hover:text-white text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-sm transition-colors">
                  <span>Mähroboter entdecken</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            )}

            {/* BOTTOM PRODUCT SHOWCASE BOX ("UNSERE RASENTRAKTOREN") */}
            <div className="bg-[#f9f9fa] border border-stone-200/85 rounded-[6px] p-5 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
              {/* Box Header */}
              <div className="flex items-center justify-between gap-4 mb-5">
                <h2 className="text-[15.5px] sm:text-[16.5px] font-semibold uppercase tracking-wide text-stone-800 pl-3 border-l-[3px] border-[#00a86b] leading-none py-0.5">
                  {mainTitle}
                </h2>
                <Link
                  href={mainLinkUrl}
                  className="text-[12.5px] font-semibold text-[#e05246] hover:text-[#c53024] inline-flex items-center gap-1 transition-all group/more shrink-0"
                >
                  <span>{mainLinkText}</span>
                  <svg className="w-3.5 h-3.5 group-hover/more:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {/* 2x3 Horizontal Product Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {mainProducts.map((product) => {
                  const href = product.slug ? `/produkt/${product.slug}` : mainLinkUrl;
                  const imageSrc = product.images?.[0] || '/images/hero-garden-mower.jpg';
                  const discountPct =
                    product.compareAtPrice && product.compareAtPrice > product.price
                      ? Math.round((1 - product.price / product.compareAtPrice) * 100)
                      : 0;
                  return (
                    <Link
                      key={product.id}
                      href={href}
                      className="relative bg-white border border-stone-200/85 hover:border-[#00a86b]/50 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:shadow-[0_10px_24px_-12px_rgba(15,23,42,0.15)] hover:-translate-y-0.5 rounded-[5px] p-4 flex items-center gap-3.5 transition-all duration-200 group min-h-[150px]"
                    >
                      {discountPct > 0 && (
                        <span className="absolute top-2.5 left-2.5 bg-[#e05246] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full z-10">
                          -{discountPct}%
                        </span>
                      )}
                      {/* Thumbnail */}
                      <div className="w-[88px] h-[88px] shrink-0 bg-stone-50/50 rounded-[4px] p-1.5 flex items-center justify-center overflow-hidden">
                        <Image
                          src={imageSrc}
                          alt={product.title}
                          width={120}
                          height={120}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Details */}
                      <div className="min-w-0 flex-1 flex flex-col justify-center">
                        <h3 className="text-[12.5px] font-medium text-stone-800 group-hover:text-[#00a86b] leading-snug line-clamp-3 transition-colors">
                          {product.title}
                        </h3>

                        <div className="mt-1.5">
                          <StarRow rating={product.rating ?? 5} size="xs" />
                        </div>

                        <div className="mt-1.5 flex flex-col leading-tight">
                          {product.compareAtPrice && product.compareAtPrice > product.price && (
                            <Price
                              amount={product.compareAtPrice}
                              showTax={false}
                              className="text-[11.5px] text-stone-400 line-through tabular-nums"
                            />
                          )}
                          <Price
                            amount={product.price}
                            showTax={false}
                            className="text-[15px] font-semibold text-[#e05246] tabular-nums mt-0.5"
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
