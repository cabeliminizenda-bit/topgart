/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Price from '@/components/Price';
import { useCartStore } from '@/store/cartStore';
import { useTranslations } from 'next-intl';

type QuickViewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  product: any;
};

export default function QuickViewModal({ isOpen, onClose, product }: QuickViewModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const cartStore = useCartStore();
  const t = useTranslations('Product');

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setActiveImage(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const handleAddToCart = () => {
    const image = product.images && product.images.length > 0 ? product.images[0] : '';
    cartStore.addItem({
      id: product.id,
      productId: product.id,
      slug: product.slug,
      title: product.title,
      price: product.price,
      image,
      quantity,
    });
    cartStore.setIsOpen(true);
    onClose();
  };

  const sku = product.id ? product.id.split('-')[0].toUpperCase() : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px] transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />

      {/* Modal Content */}
      <div
        className="relative bg-white rounded-[6px] border border-stone-200 shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Schließen"
          className="absolute top-3.5 right-3.5 p-2 bg-white/90 hover:bg-stone-100 rounded-full text-stone-700 z-20 transition cursor-pointer border border-stone-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Left Column: Images */}
        <div className="w-full md:w-1/2 bg-[#f9f9fa] p-6 flex flex-col gap-3.5 overflow-y-auto border-b md:border-b-0 md:border-r border-stone-100">
          <div className="w-full aspect-square bg-white rounded-[4px] flex items-center justify-center overflow-hidden border border-stone-200">
            {product.images && product.images.length > 0 ? (
              <Image
                width={700}
                height={700}
                src={product.images[activeImage]}
                alt={product.title}
                title={product.title}
                className="w-full h-full object-contain p-4"
              />
            ) : (
              <svg className="w-16 h-16 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.3} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </div>

          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto py-1 no-scrollbar">
              {product.images.map((img: string, idx: number) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`w-16 h-14 shrink-0 rounded-[3px] border overflow-hidden bg-white p-1 cursor-pointer ${
                    activeImage === idx ? 'border-[#00a86b] ring-1 ring-[#00a86b]/30' : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <Image
                    width={100}
                    height={100}
                    src={img}
                    alt={`${product.title} – Bild ${idx + 1}`}
                    className="w-full h-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Details */}
        <div className="w-full md:w-1/2 p-6 md:p-7 flex flex-col overflow-y-auto">
          <h2 className="text-[20px] font-medium text-stone-800 mb-2 leading-snug pr-8">{product.title}</h2>

          <div className="flex items-baseline gap-2.5 mb-4">
            <Price amount={product.price} className="text-[22px] font-medium text-[#e05246] tabular-nums" />
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <Price amount={product.compareAtPrice} showTax={false} className="text-stone-400 line-through text-sm tabular-nums" />
            )}
          </div>

          {(product.shortDescription || product.description) && (
            <div className="text-[13px] text-stone-600 leading-relaxed mb-5 line-clamp-5">
              {String(product.shortDescription || product.description)
                .replace(/<[^>]*>?/gm, '')
                .replace(/&nbsp;/g, ' ')}
            </div>
          )}

          {/* Actions: Qty + Add to cart */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center justify-between border border-stone-200 rounded-[4px] bg-white w-[106px] h-[42px] shrink-0">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                aria-label="Menge verringern"
                className="w-8 h-full flex items-center justify-center text-stone-600 hover:bg-stone-50 cursor-pointer"
              >
                −
              </button>
              <input
                type="text"
                value={quantity}
                readOnly
                aria-label="Menge"
                className="w-8 text-center bg-transparent text-sm font-medium text-stone-800 outline-none"
              />
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                aria-label="Menge erhöhen"
                className="w-8 h-full flex items-center justify-center text-stone-600 hover:bg-stone-50 cursor-pointer"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-1 bg-[#00a86b] hover:bg-[#008f5a] text-white font-semibold text-[13.5px] rounded-[4px] h-[42px] transition-colors cursor-pointer"
            >
              {t('add_to_cart') || 'In den Warenkorb'}
            </button>
          </div>

          {product.slug && (
            <Link
              href={`/produkt/${product.slug}`}
              onClick={onClose}
              className="text-xs font-medium text-[#00a86b] hover:underline mb-5 inline-flex items-center gap-1"
            >
              <span>Alle Produktdetails ansehen</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}

          {/* Meta Info */}
          <div className="space-y-2 pt-4 mt-auto border-t border-stone-100 text-xs text-stone-500">
            {sku && (
              <div className="flex items-start gap-2">
                <span className="font-medium text-stone-700">{t('sku')}</span>
                <span>{sku}</span>
              </div>
            )}
            {product.categories && product.categories.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="font-medium text-stone-700">{t('categories')}</span>
                <span>{product.categories.map((c: any) => c.name).join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
