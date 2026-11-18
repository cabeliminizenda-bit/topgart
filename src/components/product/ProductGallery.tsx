'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

type ProductGalleryProps = {
  images: string[];
  title: string;
  discountLabel?: string | null;
  compareAtPrice?: number | null;
  price?: number;
  activeVariationImage?: string | null;
};

const VISIBLE_THUMBS = 5;

export default function ProductGallery({
  images,
  title,
  discountLabel,
  compareAtPrice,
  price,
  activeVariationImage,
}: ProductGalleryProps) {
  const safeImages = Array.isArray(images) ? images.filter(Boolean) : [];
  const hasImages = safeImages.length > 0;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [thumbStart, setThumbStart] = useState(0);

  useEffect(() => {
    if (activeVariationImage) {
      setSelectedIndex(0);
      setThumbStart(0);
    }
  }, [activeVariationImage]);

  const handleSelect = (idx: number) => {
    setSelectedIndex(idx);
    if (idx < thumbStart) {
      setThumbStart(idx);
    } else if (idx >= thumbStart + VISIBLE_THUMBS) {
      setThumbStart(Math.max(0, idx - VISIBLE_THUMBS + 1));
    }
  };

  const handlePrev = () => {
    if (!hasImages) return;
    const nextIdx = Math.max(0, selectedIndex - 1);
    handleSelect(nextIdx);
  };

  const handleNext = () => {
    if (!hasImages) return;
    const nextIdx = Math.min(safeImages.length - 1, selectedIndex + 1);
    handleSelect(nextIdx);
  };

  const mainImage = activeVariationImage || (hasImages ? safeImages[selectedIndex] : null);
  const visibleSlice = safeImages.slice(thumbStart, thumbStart + VISIBLE_THUMBS);

  return (
    <div className="w-full lg:w-[49%] flex flex-col-reverse lg:flex-row gap-3 sm:gap-3.5 lg:self-start lg:sticky lg:top-6">
      {/* Vertical Thumbnails Column on Desktop / Horizontal Row on Mobile */}
      <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible no-scrollbar py-1 lg:py-0 lg:w-[86px] shrink-0">
        {/* Desktop Top Green Up Arrow */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={!hasImages || selectedIndex === 0}
          aria-label="Vorheriges Bild"
          className="hidden lg:flex w-full h-6 bg-[#00a86b] hover:bg-[#008f5a] text-white rounded-[3px] items-center justify-center disabled:opacity-45 transition-colors cursor-pointer shrink-0"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
          </svg>
        </button>

        {/* Thumbnails */}
        {hasImages ? (
          <div className="flex lg:flex-col gap-2">
            {visibleSlice.map((img, offset) => {
              const realIdx = thumbStart + offset;
              const isSelected = realIdx === selectedIndex && !activeVariationImage;
              return (
                <button
                  type="button"
                  key={`${img}-${realIdx}`}
                  onClick={() => handleSelect(realIdx)}
                  aria-label={`Bild ${realIdx + 1} anzeigen`}
                  className={`border rounded-[3px] overflow-hidden cursor-pointer w-16 h-14 lg:w-[86px] lg:h-[64px] shrink-0 transition-all bg-white p-1 flex items-center justify-center ${
                    isSelected
                      ? 'border-[#00a86b] ring-1 ring-[#00a86b]/35'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <Image
                    width={120}
                    height={90}
                    src={img}
                    alt={`${title} – Vorschau ${realIdx + 1}`}
                    title={`${title} – Vorschau ${realIdx + 1}`}
                    className="w-full h-full object-contain"
                  />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="border border-stone-200 rounded-[3px] w-16 h-14 lg:w-[86px] lg:h-[64px] bg-stone-50 flex items-center justify-center text-stone-300 shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Desktop Bottom Green Down Arrow */}
        <button
          type="button"
          onClick={handleNext}
          disabled={!hasImages || selectedIndex >= safeImages.length - 1}
          aria-label="Nächstes Bild"
          className="hidden lg:flex w-full h-6 bg-[#00a86b] hover:bg-[#008f5a] text-white rounded-[3px] items-center justify-center disabled:opacity-45 transition-colors cursor-pointer shrink-0"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Main Large Bordered White Image Container */}
      <div className="flex-1 border border-stone-200 rounded-[4px] relative overflow-hidden flex items-center justify-center bg-white aspect-square sm:min-h-[420px]">
        {discountLabel && compareAtPrice && price && compareAtPrice > price && (
          <span className="absolute top-3 left-3 bg-[#e05246] text-white text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-[3px] z-10">
            {discountLabel}
          </span>
        )}

        {/* Mobile counter pill */}
        {hasImages && safeImages.length > 1 && (
          <span className="lg:hidden absolute bottom-3 right-3 bg-stone-900/75 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full z-10">
            {selectedIndex + 1} / {safeImages.length}
          </span>
        )}

        {mainImage ? (
          <Image
            width={900}
            height={900}
            src={mainImage}
            alt={title}
            title={title}
            priority
            className="w-full h-full object-contain p-4 sm:p-6 transition-all duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-stone-300 gap-2 p-8">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs text-stone-400">Kein Produktbild verfügbar</span>
          </div>
        )}
      </div>
    </div>
  );
}
