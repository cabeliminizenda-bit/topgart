'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface StoreTrustCardsProps {
  couponCode?: string;
  className?: string;
}

/**
 * 3 Trust Feature Cards (Kostenlose Rückgabe, Kostenlose Lieferung, Rabattcode)
 * Harmonized design matching store guidelines and German trust standards.
 */
export default function StoreTrustCards({
  couponCode = 'GUT727AG',
  className = '',
}: StoreTrustCardsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCoupon = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(couponCode);
      setCopied(true);
      toast.success(`Rabattcode "${couponCode}" kopiert!`, {
        icon: '🎁',
        duration: 3500,
      });
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 ${className}`}>
      {/* 1. Kostenlose Rückgabe */}
      <Link
        href="/rueckgabe-und-erstattung"
        className="bg-white hover:bg-[#f9f9fa] border border-stone-200/90 hover:border-[#00a86b]/45 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_20px_-10px_rgba(15,23,42,0.12)] hover:-translate-y-0.5 rounded-[6px] px-4 py-3.5 sm:py-4 flex items-center gap-3.5 transition-all group"
      >
        <div className="w-11 h-11 rounded-full bg-stone-50 border border-stone-200/80 text-[#00a86b] flex items-center justify-center shrink-0 group-hover:bg-[#00a86b] group-hover:border-[#00a86b] group-hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
        href="/versand"
        className="bg-white hover:bg-[#f9f9fa] border border-stone-200/90 hover:border-[#00a86b]/45 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_20px_-10px_rgba(15,23,42,0.12)] hover:-translate-y-0.5 rounded-[6px] px-4 py-3.5 sm:py-4 flex items-center gap-3.5 transition-all group"
      >
        <div className="w-11 h-11 rounded-full bg-stone-50 border border-stone-200/80 text-[#00a86b] flex items-center justify-center shrink-0 group-hover:bg-[#00a86b] group-hover:border-[#00a86b] group-hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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

      {/* 3. First-time visitor coupon */}
      <button
        type="button"
        onClick={handleCopyCoupon}
        className="bg-white hover:bg-[#f9f9fa] border border-stone-200/90 hover:border-[#00a86b]/45 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_20px_-10px_rgba(15,23,42,0.12)] hover:-translate-y-0.5 rounded-[6px] px-4 py-3.5 sm:py-4 flex items-center gap-3.5 transition-all group text-left cursor-pointer"
        title={`Rabattcode ${couponCode} kopieren`}
      >
        <div className="w-11 h-11 rounded-full bg-stone-50 border border-stone-200/80 text-[#00a86b] flex items-center justify-center shrink-0 group-hover:bg-[#00a86b] group-hover:border-[#00a86b] group-hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
            <span className="text-[#e05246] font-semibold bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-[3px]">
              {copied ? 'Kopiert!' : couponCode}
            </span>
          </p>
        </div>
      </button>
    </div>
  );
}
