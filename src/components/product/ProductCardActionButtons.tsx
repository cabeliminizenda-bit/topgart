'use client';

import React from 'react';

type ProductCardActionButtonsProps = {
  isWishlisted: boolean;
  onToggleWishlist: (e: React.MouseEvent) => void;
  onQuickView: (e: React.MouseEvent) => void;
  wishlistTitle?: string;
  quickViewTitle?: string;
  positionClassName?: string;
  buttonSizeClassName?: string;
};

/**
 * Vertically stacked Wishlist + Quick View emerald action buttons (no Compare icon)
 * positioned at the upper-right of product card images.
 */
export default function ProductCardActionButtons({
  isWishlisted,
  onToggleWishlist,
  onQuickView,
  wishlistTitle,
  quickViewTitle = 'Schnellansicht',
  positionClassName = 'top-3 right-3',
  buttonSizeClassName = 'w-9 h-9',
}: ProductCardActionButtonsProps) {
  return (
    <div
      className={`absolute ${positionClassName} z-20 flex flex-col gap-2 transition-all duration-200 ${
        isWishlisted
          ? 'opacity-100'
          : 'opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:translate-x-1.5 lg:group-hover:translate-x-0'
      }`}
    >
      {/* Wishlist Button */}
      <button
        type="button"
        onClick={onToggleWishlist}
        className={`${buttonSizeClassName} rounded-full flex items-center justify-center transition-all duration-200 shadow-md ring-2 ring-white hover:scale-105 cursor-pointer ${
          isWishlisted
            ? 'bg-[#e05246] hover:bg-[#c94136] text-white'
            : 'bg-[#00a86b] hover:bg-[#008f5a] text-white'
        }`}
        title={
          wishlistTitle ||
          (isWishlisted ? 'Von der Wunschliste entfernen' : 'Zur Wunschliste hinzufügen')
        }
        aria-label={isWishlisted ? 'Von der Wunschliste entfernen' : 'Zur Wunschliste hinzufügen'}
      >
        <svg
          className="w-4 h-4"
          fill={isWishlisted ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.9}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </button>

      {/* Quick View Button */}
      <button
        type="button"
        onClick={onQuickView}
        className={`${buttonSizeClassName} rounded-full bg-[#00a86b] hover:bg-[#008f5a] text-white flex items-center justify-center transition-all duration-200 shadow-md ring-2 ring-white hover:scale-105 cursor-pointer`}
        title={quickViewTitle}
        aria-label="Schnellansicht"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.9}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      </button>
    </div>
  );
}
