'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import Price from '@/components/Price';

export interface GardenDealProduct {
  id: string;
  title: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  images?: string[];
  rating?: number;
  reviewCount?: number;
}

interface GardenDealsShowcaseProps {
  catalogProducts?: GardenDealProduct[];
  config?: Record<string, any>;
}

const FALLBACK_DEALS: GardenDealProduct[] = [
  {
    id: 'fallback-1',
    title: 'Iseki Rasentraktor CM 7226 H',
    slug: '',
    price: 2415.8,
    images: ['/images/hero-garden-mower.jpg'],
    rating: 5,
  },
  {
    id: 'fallback-2',
    title: 'Segway Mähroboter Navimow ohne Begrenzungskabel',
    slug: '',
    price: 698.92,
    images: ['/images/hero-robot-mower.jpg'],
    rating: 5,
  },
  {
    id: 'fallback-3',
    title: 'Einhell Professional Akku-Rasenmäher GP-CM 36/47',
    slug: '',
    price: 449.99,
    images: ['/images/hero-garden-mower.jpg'],
    rating: 0,
  },
  {
    id: 'fallback-4',
    title: 'Husqvarna Automower 310 Mark II Mähroboter',
    slug: '',
    price: 1189.0,
    images: ['/images/hero-robot-mower.jpg'],
    rating: 5,
  },
  {
    id: 'fallback-5',
    title: 'STIHL Benzin-Kettensäge MS 251 Hochleistung',
    slug: '',
    price: 529.0,
    images: ['/images/hero-garden-mower.jpg'],
    rating: 5,
  },
  {
    id: 'fallback-6',
    title: 'GARDENA Akku-Rasentrimmer ComfortCut 23/18V',
    slug: '',
    price: 169.9,
    images: ['/images/hero-robot-mower.jpg'],
    rating: 4,
  },
];

function StarRow({ rating = 5 }: { rating?: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div className="flex items-center gap-0.5" aria-label={`Bewertung ${filled} von 5 Sternen`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3.5 h-3.5 ${
            star <= filled ? 'text-[#f5b400] fill-[#f5b400]' : 'text-[#f5b400] fill-none'
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

export default function GardenDealsShowcase({
  catalogProducts = [],
  config = {},
}: GardenDealsShowcaseProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ days: 2, hours: 14, minutes: 35, seconds: 42 });

  const promoSubtitle = config?.promoSubtitle || 'Ein perfekter Rasen für den Sommer.';
  const promoTitle = config?.promoTitle || 'Beste Angebote';
  const promoBadgeTop = config?.promoBadgeTop || 'Ab';
  const promoBadgePrice = config?.promoBadgePrice || '250€';
  const promoImage =
    (typeof config?.promoImage === 'string' && config.promoImage.trim()) ||
    (typeof config?.spotlight?.image === 'string' && config.spotlight.image.trim()) ||
    '/images/promo-summer-lawn.jpg';
  const promoUrl = config?.promoUrl || '/shop';
  const couponCode = config?.couponCode || 'GUT727AG';
  const sectionTitle = config?.title || 'Aktuelle Angebote';

  // Live countdown timer (ticks smoothly; rolls forward every 3 days if no fixed future date is configured)
  useEffect(() => {
    const computeRemaining = () => {
      const configuredDate = config?.countdown ? new Date(config.countdown).getTime() : NaN;
      let targetMs = configuredDate;
      const now = Date.now();
      if (!Number.isFinite(targetMs) || targetMs <= now) {
        // Rolling 3-day campaign window anchored cleanly to midnight
        const threeDays = 3 * 24 * 60 * 60 * 1000;
        targetMs = Math.ceil((now + 1000) / threeDays) * threeDays;
      }
      const diff = Math.max(0, targetMs - now);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft({ days, hours, minutes, seconds });
    };

    computeRemaining();
    const interval = setInterval(computeRemaining, 1000);
    return () => clearInterval(interval);
  }, [config?.countdown]);

  // Build deals list: prioritize discounted real DB products, then other DB products, else garden fallbacks
  const deals = useMemo(() => {
    if (catalogProducts && catalogProducts.length > 0) {
      const discounted = catalogProducts.filter(
        (p) => p.compareAtPrice && p.compareAtPrice > p.price
      );
      const rest = catalogProducts.filter(
        (p) => !(p.compareAtPrice && p.compareAtPrice > p.price)
      );
      return [...discounted, ...rest].slice(0, 12);
    }
    return FALLBACK_DEALS;
  }, [catalogProducts]);

  const itemsPerPage = 3;
  const totalPages = Math.max(1, Math.ceil(deals.length / itemsPerPage));
  const safePageIndex = pageIndex % totalPages;
  const visibleDeals = deals.slice(
    safePageIndex * itemsPerPage,
    safePageIndex * itemsPerPage + itemsPerPage
  );

  const handlePrev = () => {
    setPageIndex((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const handleNext = () => {
    setPageIndex((prev) => (prev + 1) % totalPages);
  };

  const handleCopyCoupon = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(couponCode);
      }
      toast.success(`Rabattcode ${couponCode} kopiert!`);
    } catch {
      toast.success(`Rabattcode: ${couponCode}`);
    }
  };

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <section className="bg-white py-5 sm:py-7 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-stretch gap-6">
          {/* LEFT VERTICAL PROMO BANNER (aligned with Hero Left Sidebar width: 254px) */}
          <Link
            href={promoUrl}
            className="relative w-full lg:w-[254px] shrink-0 min-h-[320px] lg:min-h-[370px] rounded-[5px] overflow-hidden block group shadow-xs border border-stone-200/70"
          >
            {promoImage === '/images/promo-summer-lawn.jpg' ? (
              <picture className="absolute inset-0 w-full h-full">
                <source
                  type="image/avif"
                  media="(max-width: 768px)"
                  srcSet="/images/promo-summer-lawn-mobile.avif"
                />
                <source
                  type="image/avif"
                  media="(min-width: 769px)"
                  srcSet="/images/promo-summer-lawn.avif"
                />
                <source
                  type="image/webp"
                  media="(max-width: 768px)"
                  srcSet="/images/promo-summer-lawn-mobile.webp"
                />
                <source
                  type="image/webp"
                  media="(min-width: 769px)"
                  srcSet="/images/promo-summer-lawn.webp"
                />
                <img
                  src="/images/promo-summer-lawn.jpg"
                  alt={promoTitle}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
              </picture>
            ) : (
              <Image
                src={promoImage}
                alt={promoTitle}
                fill
                sizes="(max-width: 1024px) 100vw, 254px"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
            )}

            {/* Soft bright top haze so red headline pops cleanly just like mockup */}
            <div
              className="absolute inset-x-0 top-0 h-44 pointer-events-none"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(255,255,255,0.68) 0%, rgba(255,255,255,0.45) 55%, rgba(255,255,255,0) 100%)',
              }}
            />

            {/* Top Centered Red Copy */}
            <div className="relative z-10 px-4 pt-9 text-center">
              <p className="text-[11.5px] font-semibold text-[#d63b2f] leading-snug drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">
                {promoSubtitle}
              </p>
              <h3 className="mt-2 text-[22px] font-bold text-[#d63b2f] tracking-tight leading-tight drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
                {promoTitle}
              </h3>
            </div>

            {/* Circular Red Price Badge ("Ab 250€") */}
            <div className="absolute left-5 top-[44%] z-10 w-[74px] h-[74px] rounded-full bg-[#e53e30] text-white flex flex-col items-center justify-center shadow-lg ring-4 ring-white/30 group-hover:scale-105 transition-transform">
              <span className="text-[11px] font-medium leading-none">{promoBadgeTop}</span>
              <span className="text-[17px] font-extrabold leading-tight mt-0.5">{promoBadgePrice}</span>
            </div>

            {/* Subtle Bottom CTA Pill */}
            <div className="absolute inset-x-4 bottom-4 z-10 flex justify-center">
              <span className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-xs text-stone-800 group-hover:bg-[#00a86b] group-hover:text-white text-[12px] font-semibold px-4 py-2 rounded-full shadow-md transition-colors">
                <span>Angebote entdecken</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </Link>

          {/* RIGHT COLUMN: 3 Trust Cards + Aktuelle Angebote Box */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">
            {/* TOP ROW: 3 Trust Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* 1. Kostenlose Rückgabe */}
              <Link
                href="/rueckgabe-und-erstattung"
                className="bg-[#f9f9fa] hover:bg-[#f4f5f6] border border-stone-200/85 hover:border-[#00a86b]/45 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_20px_-10px_rgba(15,23,42,0.12)] hover:-translate-y-0.5 rounded-[6px] px-4 py-4 flex items-center gap-3.5 transition-all group"
              >
                <div className="w-11 h-11 rounded-full bg-white border border-stone-200/80 text-[#00a86b] flex items-center justify-center shrink-0 group-hover:bg-[#00a86b] group-hover:border-[#00a86b] group-hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h4 className="text-[13px] font-bold text-stone-800 group-hover:text-[#00a86b] transition-colors leading-snug">
                    Kostenlose Rückgabe
                  </h4>
                  <p className="text-[12px] text-stone-500 mt-0.5 truncate">
                    Siehe Rückgabebedingungen
                  </p>
                </div>
              </Link>

              {/* 2. Kostenlose Lieferung */}
              <Link
                href="/lieferzeiten"
                className="bg-[#f9f9fa] hover:bg-[#f4f5f6] border border-stone-200/85 hover:border-[#00a86b]/45 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_20px_-10px_rgba(15,23,42,0.12)] hover:-translate-y-0.5 rounded-[6px] px-4 py-4 flex items-center gap-3.5 transition-all group"
              >
                <div className="w-11 h-11 rounded-full bg-white border border-stone-200/80 text-[#00a86b] flex items-center justify-center shrink-0 group-hover:bg-[#00a86b] group-hover:border-[#00a86b] group-hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.9}
                      d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h4 className="text-[13px] font-bold text-stone-800 group-hover:text-[#00a86b] transition-colors leading-snug">
                    Kostenlose Lieferung
                  </h4>
                  <p className="text-[12px] text-stone-500 mt-0.5 truncate">
                    Siehe Versandbedingungen
                  </p>
                </div>
              </Link>

              {/* 3. First-time visitor coupon card */}
              <button
                type="button"
                onClick={handleCopyCoupon}
                className="bg-[#f9f9fa] hover:bg-[#f4f5f6] border border-stone-200/85 hover:border-[#00a86b]/45 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_20px_-10px_rgba(15,23,42,0.12)] hover:-translate-y-0.5 rounded-[6px] px-4 py-4 flex items-center gap-3.5 transition-all group text-left cursor-pointer"
                title={`Rabattcode ${couponCode} kopieren`}
              >
                <div className="w-11 h-11 rounded-full bg-white border border-stone-200/80 text-[#00a86b] flex items-center justify-center shrink-0 group-hover:bg-[#00a86b] group-hover:border-[#00a86b] group-hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.9}
                      d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h4 className="text-[13px] font-bold text-stone-800 group-hover:text-[#00a86b] transition-colors leading-snug">
                    Sind Sie zum ersten Mal hier?
                  </h4>
                  <p className="text-[12px] text-stone-500 mt-0.5 truncate">
                    Rabattcode{' '}
                    <span className="text-[#e05246] font-semibold bg-white/90 px-1.5 py-0.5 rounded-[3px]">{couponCode}</span>
                  </p>
                </div>
              </button>
            </div>

            {/* BOTTOM ROW: "Aktuelle Angebote" Countdown & 3-Card Product Carousel */}
            <div className="bg-[#f9f9fa] border border-stone-200/85 rounded-[6px] p-5 flex-1 flex flex-col justify-between shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
              {/* Header: Title + Green Countdown Badge + Carousel Arrows */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <div className="flex flex-wrap items-center gap-4">
                  <h2 className="text-[18px] font-semibold text-stone-800 tracking-tight pl-3 border-l-[3px] border-[#00a86b] leading-none py-0.5">
                    {sectionTitle}
                  </h2>

                  {/* Green Countdown Pill */}
                  <div className="bg-[#00a86b] text-white rounded-[5px] px-3.5 py-1.5 flex items-center divide-x divide-white/20 shadow-xs tabular-nums">
                    <div className="text-center leading-tight pr-3">
                      <span className="block text-[13px] font-bold">{pad(timeLeft.days)}</span>
                      <span className="block text-[9.5px] uppercase tracking-wider text-white/85">Tage</span>
                    </div>
                    <div className="text-center leading-tight px-3">
                      <span className="block text-[13px] font-bold">{pad(timeLeft.hours)}</span>
                      <span className="block text-[9.5px] uppercase tracking-wider text-white/85">Std</span>
                    </div>
                    <div className="text-center leading-tight px-3">
                      <span className="block text-[13px] font-bold">{pad(timeLeft.minutes)}</span>
                      <span className="block text-[9.5px] uppercase tracking-wider text-white/85">Min.</span>
                    </div>
                    <div className="text-center leading-tight pl-3">
                      <span className="block text-[13px] font-bold">{pad(timeLeft.seconds)}</span>
                      <span className="block text-[9.5px] uppercase tracking-wider text-white/85">Sek.</span>
                    </div>
                  </div>
                </div>

                {/* Round Carousel Navigation Arrows */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label="Vorherige Angebote"
                    className="w-8 h-8 rounded-full bg-[#4ec198] hover:bg-[#00a86b] text-white flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label="Nächste Angebote"
                    className="w-8 h-8 rounded-full bg-[#4ec198] hover:bg-[#00a86b] text-white flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* 3 Horizontal Deal Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {visibleDeals.map((product) => {
                  const href = product.slug ? `/produkt/${product.slug}` : '/shop';
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
                      {/* Product Thumbnail */}
                      <div className="w-[92px] h-[92px] shrink-0 relative bg-stone-50/50 rounded-[4px] p-1.5 flex items-center justify-center overflow-hidden">
                        <Image
                          src={imageSrc}
                          alt={product.title}
                          width={120}
                          height={120}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="min-w-0 flex-1 flex flex-col justify-center">
                        <h3 className="text-[13px] font-medium text-stone-800 group-hover:text-[#00a86b] leading-snug line-clamp-3 transition-colors">
                          {product.title}
                        </h3>

                        <div className="mt-2">
                          <StarRow rating={product.rating ?? 5} />
                        </div>

                        <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
                          <Price
                            amount={product.price}
                            showTax={false}
                            className="text-[15.5px] font-semibold text-[#e05246] tabular-nums"
                          />
                          {product.compareAtPrice && product.compareAtPrice > product.price && (
                            <Price
                              amount={product.compareAtPrice}
                              showTax={false}
                              className="text-[11.5px] text-stone-400 line-through tabular-nums"
                            />
                          )}
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
