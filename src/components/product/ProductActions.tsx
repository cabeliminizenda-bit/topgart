/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCurrency } from '@/components/CurrencyProvider';
import { useTranslations } from 'next-intl';
import SafeHTML from '@/components/SafeHTML';

interface ProductActionsProps {
  product: {
    id: string;
    slug?: string;
    title: string;
    shortDescription?: string | null;
    price: number;
    compareAtPrice?: number | null;
    type: string;
    stock: number | null;
    images: string[];
    attributes?: { name: string; options: string[] }[];
    variations?: {
      id: string;
      price: string;
      stock?: string;
      image?: string;
      attributes: Record<string, string>;
    }[];
    forceSales?: any[];
    saleTogether?: any[];
  };
  reviews?: { rating: number }[];
  enableBuyNow?: boolean;
  onVariationChange?: (image: string | null) => void;
  shippingInfo?: string[];
  contactSlug?: string;
}

function getDeterministicCount(seed: string, min: number, max: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return min + (hash % (max - min + 1));
}

export default function ProductActions({
  product,
  reviews = [],
  enableBuyNow = true,
  onVariationChange,
  contactSlug = 'kontakt',
}: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const { formatPrice } = useCurrency();
  const [addedItemName, setAddedItemName] = useState<string | null>(null);
  const [wishlistedItemName, setWishlistedItemName] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [selectedSaleTogether, setSelectedSaleTogether] = useState<string[]>([]);
  const actionButtonsRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const t = useTranslations('Product');

  const viewerCount = getDeterministicCount(product.id || product.title, 17, 29);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!actionButtonsRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyBar(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 }
    );
    observer.observe(actionButtonsRef.current);
    return () => observer.disconnect();
  }, []);

  const cartStore = useCartStore();
  const wishlistStore = useWishlistStore();
  const isWishlisted = wishlistStore.hasItem(product.id);

  // Variable products
  const isVariable = product.type === 'VARIABLE';
  const attributes = product.attributes || [];
  const variations = product.variations || [];

  let currentVariation: {
    id: string;
    price: string;
    stock?: string;
    image?: string;
    attributes: Record<string, string>;
  } | null = null;
  if (isVariable && Object.keys(selectedAttributes).length === attributes.length) {
    currentVariation =
      variations.find((v) =>
        Object.entries(selectedAttributes).every(([key, value]) => v.attributes[key] === value)
      ) || null;
  }

  useEffect(() => {
    if (onVariationChange) {
      onVariationChange(currentVariation?.image || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVariation?.id]);

  const currentPrice = currentVariation ? parseFloat(currentVariation.price) : product.price;
  const currentStock = currentVariation
    ? currentVariation.stock
      ? parseInt(currentVariation.stock, 10)
      : null
    : product.stock;

  const isOutOfStock = currentStock !== null && currentStock <= 0;

  const getCartItemBase = (
    prod: any,
    price: number,
    qty: number = 1,
    currentVar: any = null,
    attrs: any = undefined
  ) => ({
    id: currentVar ? `${prod.id}-${currentVar.id}` : prod.id,
    productId: prod.id,
    slug: prod.slug,
    variationId: currentVar?.id,
    title: prod.title,
    price,
    image: currentVar?.image || prod.images?.[0] || '',
    quantity: qty,
    attributes: attrs,
  });

  const getLinkedItemsForCart = (qty: number) => {
    const fsItems = (product.forceSales || []).map((fs) => getCartItemBase(fs, fs.price, qty));
    const stItems = (product.saleTogether || [])
      .filter((st) => selectedSaleTogether.includes(st.id))
      .map((st) => getCartItemBase(st, st.price, 1));
    return [...fsItems, ...stItems];
  };

  const handleAddToCart = () => {
    if (isVariable && !currentVariation) {
      alert(t('select_options_cart'));
      return;
    }

    const mainItem = getCartItemBase(
      product,
      currentPrice,
      quantity,
      currentVariation,
      currentVariation ? selectedAttributes : undefined
    );
    const linkedItems = getLinkedItemsForCart(quantity);

    cartStore.addItem(mainItem, linkedItems);
    cartStore.setIsOpen(true);

    setAddedItemName(product.title);
    setTimeout(() => {
      setAddedItemName(null);
    }, 5000);
  };

  const handleBuyNow = () => {
    if (isVariable && !currentVariation) {
      alert(t('select_options_buy'));
      return;
    }

    const mainItem = getCartItemBase(
      product,
      currentPrice,
      quantity,
      currentVariation,
      currentVariation ? selectedAttributes : undefined
    );
    const linkedItems = getLinkedItemsForCart(quantity);

    cartStore.addItem(mainItem, linkedItems);
    router.push('/checkout');
  };

  const handleToggleWishlist = () => {
    const wasWishlisted = wishlistStore.hasItem(product.id);
    wishlistStore.toggleItem(product.id);

    if (!wasWishlisted) {
      setWishlistedItemName(product.title);
      wishlistStore.setIsOpen(true);
      setTimeout(() => {
        setWishlistedItemName(null);
      }, 5000);
    }
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (!url) return;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: product.title, url });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2500);
      } catch {
        // Ignore clipboard errors
      }
    }
  };

  const notificationPortal = isClient ? document.getElementById('cart-notification-portal') : null;
  const disablePurchase = (isVariable && !currentVariation) || isOutOfStock;

  const reviewCount = reviews.length;
  const avgRating =
    reviewCount > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount : 0;
  const filledStars = Math.round(avgRating);

  const handleScrollToReviews = () => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('open-product-reviews'));
    const target = document.getElementById('produkt-bewertungen');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div>
      {/* Cart & Wishlist Toast Portals */}
      {addedItemName &&
        notificationPortal &&
        createPortal(
          <div className="bg-[#00a86b] text-white px-5 py-3.5 mb-6 flex flex-col sm:flex-row items-center justify-between shadow-xs rounded-[4px]">
            <div className="flex items-center gap-3 text-sm font-medium">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span>{t('added_to_cart', { name: addedItemName })}</span>
            </div>
            <Link
              href="/cart"
              className="mt-3 sm:mt-0 text-xs font-bold tracking-wider hover:underline whitespace-nowrap bg-black/15 hover:bg-black/25 transition-colors px-5 py-2.5 rounded-[3px]"
            >
              {t('view_cart_caps')}
            </Link>
          </div>,
          notificationPortal
        )}

      {wishlistedItemName &&
        notificationPortal &&
        createPortal(
          <div className="bg-stone-800 text-white px-5 py-3.5 mb-6 flex flex-col sm:flex-row items-center justify-between shadow-xs rounded-[4px]">
            <div className="flex items-center gap-3 text-sm font-medium">
              <svg className="w-5 h-5 shrink-0 text-[#e05246]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{t('added_to_wishlist', { name: wishlistedItemName })}</span>
            </div>
            <Link
              href="/wishlist"
              className="mt-3 sm:mt-0 text-xs font-bold tracking-wider hover:underline whitespace-nowrap bg-white/10 hover:bg-white/20 transition-colors px-5 py-2.5 rounded-[3px]"
            >
              {t('view_wishlist_caps')}
            </Link>
          </div>,
          notificationPortal
        )}

      {/* Price Display */}
      <div className="flex items-baseline gap-3">
        <span className="text-[22px] font-medium text-[#e05246] tabular-nums leading-none">
          {formatPrice(currentPrice)}
        </span>
        {product.compareAtPrice && !currentVariation && product.compareAtPrice > currentPrice && (
          <span className="text-[16px] text-stone-400 line-through tabular-nums">
            {formatPrice(product.compareAtPrice)}
          </span>
        )}
      </div>

      {/* Star Rating & Reviews Summary right below Price */}
      <button
        type="button"
        onClick={handleScrollToReviews}
        className="mt-2.5 inline-flex items-center gap-2 group cursor-pointer text-left"
        aria-label={
          reviewCount > 0
            ? `Bewertung ${avgRating.toFixed(1)} von 5 Sternen aus ${reviewCount} Bewertungen`
            : 'Noch keine Bewertungen – Jetzt bewerten'
        }
      >
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              className="w-4 h-4 text-[#f5a623]"
              viewBox="0 0 20 20"
              fill={star <= filledStars ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        {reviewCount > 0 ? (
          <span className="text-[12.5px] text-stone-600 group-hover:text-[#00a86b] transition-colors">
            <strong className="font-semibold text-stone-800">{avgRating.toFixed(1).replace('.', ',')}</strong>{' '}
            <span className="text-stone-500 group-hover:text-[#00a86b] underline-offset-2 group-hover:underline">
              ({reviewCount} {reviewCount === 1 ? 'Bewertung' : 'Bewertungen'})
            </span>
          </span>
        ) : (
          <span className="text-[12.5px] text-stone-500 group-hover:text-[#00a86b] underline-offset-2 group-hover:underline transition-colors">
            (0 Bewertungen – Bewertung schreiben)
          </span>
        )}
      </button>

      {selectedSaleTogether.length > 0 && (
        <div className="text-xs font-medium text-stone-600 mt-2 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-[4px] inline-block">
          {t('total_with_options')}{' '}
          <span className="text-[#e05246] font-semibold ml-1 tabular-nums">
            {formatPrice(
              currentPrice * quantity +
                (product.saleTogether || [])
                  .filter((st) => selectedSaleTogether.includes(st.id))
                  .reduce((acc, curr) => acc + curr.price, 0)
            )}
          </span>
        </div>
      )}

      {/* Urgency Demand Line */}
      <div className="mt-3 flex items-center gap-1.5 text-[12.5px] text-[#e05246]">
        <svg className="w-4 h-4 shrink-0 text-[#e05246]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M13.5 2.25c.38 2.42-1.15 4.46-2.34 5.93-.75.93-1.41 1.74-1.41 2.82 0 .92.54 1.65 1.38 1.93-.22-.69-.13-1.51.4-2.16.46-.57 1.12-.92 1.67-1.44.78-.74 1.38-1.69 1.54-2.85 2.09 1.67 3.76 4.21 3.76 7.37 0 4.25-3.27 7.45-7.25 7.45S4.5 18.1 4.5 13.85c0-3.17 1.7-6.06 4.3-8.02 1.48-1.11 3.12-2.21 4.7-3.58z" />
        </svg>
        <span>Verkauft sich schnell! Über 20 Personen haben ihn im Warenkorb</span>
      </div>

      {/* Short Description Bullet Features */}
      {product.shortDescription && (
        <div className="mt-4 text-[13px] text-stone-600 leading-[1.72]">
          <SafeHTML
            html={product.shortDescription}
            className="space-y-1 [&_p]:my-0.5 [&_ul]:list-none [&_ul]:pl-0 [&_ul]:space-y-0.5 [&_li]:my-0"
          />
        </div>
      )}

      {/* Force Sales UI (Required Accessories) */}
      {product.forceSales && product.forceSales.length > 0 && (
        <div className="mt-5 border border-amber-300 bg-amber-50/60 rounded-[4px] p-3.5">
          <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {t('force_sales_title')}
          </h4>
          <div className="space-y-2">
            {product.forceSales.map((fs) => (
              <div
                key={fs.id}
                className="flex items-center gap-3 bg-white p-2 rounded-[3px] border border-amber-200/70"
              >
                {fs.images?.[0] && (
                  <Image
                    width={64}
                    height={64}
                    src={fs.images[0]}
                    alt={fs.title}
                    className="w-10 h-10 object-contain rounded-[2px]"
                  />
                )}
                <div className="min-w-0">
                  <div className="text-xs font-medium text-stone-800 truncate">{fs.title}</div>
                  <div className="text-xs font-semibold text-[#e05246] tabular-nums">{formatPrice(fs.price)}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11.5px] text-amber-800 mt-2.5 leading-relaxed">{t('force_sales_msg')}</p>
        </div>
      )}

      {/* Attributes Selection (Variable Products) */}
      {isVariable && attributes.length > 0 && (
        <div className="space-y-3.5 mt-5">
          {attributes.map((attr) => (
            <div key={attr.name}>
              <span className="text-xs text-stone-500 mb-1.5 block">
                {attr.name}
                {selectedAttributes[attr.name] && (
                  <span className="text-stone-900 font-semibold ml-1">: {selectedAttributes[attr.name]}</span>
                )}
              </span>
              <div className="flex flex-wrap gap-2">
                {attr.options.map((opt: string) => {
                  const isSelected = selectedAttributes[attr.name] === opt;
                  return (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => setSelectedAttributes({ ...selectedAttributes, [attr.name]: opt })}
                      className={`px-3 py-1.5 border rounded-[4px] text-xs transition cursor-pointer ${
                        isSelected
                          ? 'border-[#00a86b] bg-emerald-50 text-[#00a86b] font-semibold ring-1 ring-[#00a86b]/30'
                          : 'border-stone-200 text-stone-700 hover:border-stone-400 bg-white'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Primary Action Buttons: Quantity + In den Warenkorb + Jetzt kaufen */}
      <div ref={actionButtonsRef} className="mt-5 flex flex-col gap-3">
        <div className="flex items-center gap-3 w-full">
          {/* Quantity Stepper */}
          <div className="flex items-center justify-between border border-stone-200 rounded-[4px] h-[44px] w-[112px] bg-white shrink-0">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              aria-label="Menge verringern"
              className="w-9 h-full flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors cursor-pointer text-base"
            >
              −
            </button>
            <input
              type="text"
              value={quantity}
              readOnly
              aria-label="Menge"
              className="w-8 text-center bg-transparent text-[13.5px] font-medium text-stone-800 outline-none select-none"
            />
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              aria-label="Menge erhöhen"
              className="w-9 h-full flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors cursor-pointer text-base"
            >
              +
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={disablePurchase}
            className={`flex-1 h-[44px] font-semibold text-[13.5px] rounded-[4px] transition-colors px-4 cursor-pointer ${
              disablePurchase
                ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                : 'bg-[#00a86b] hover:bg-[#008f5a] active:bg-[#007a4d] text-white'
            }`}
          >
            {isOutOfStock
              ? 'Ausverkauft'
              : isVariable && !currentVariation
              ? t('select_options_btn')
              : t('add_to_cart')}
          </button>
        </div>

        {/* Full-Width Buy Now Button */}
        {enableBuyNow && (
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={disablePurchase}
            className={`w-full h-[44px] font-semibold text-[13.5px] rounded-[4px] transition-colors cursor-pointer ${
              disablePurchase
                ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                : 'bg-[#00a86b] hover:bg-[#008f5a] active:bg-[#007a4d] text-white'
            }`}
          >
            {t('buy_now')}
          </button>
        )}
      </div>

      {/* Sale Together UI (Optional Accessories) */}
      {product.saleTogether && product.saleTogether.length > 0 && (
        <div className="mt-5 border border-stone-200 rounded-[4px] p-3.5 bg-[#fafafa]">
          <h4 className="text-xs font-semibold text-stone-800 mb-3">{t('frequently_bought_together')}</h4>
          <div className="space-y-2">
            {product.saleTogether.map((st) => (
              <label
                key={st.id}
                className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-[3px] transition border border-transparent hover:border-stone-200"
              >
                <input
                  type="checkbox"
                  checked={selectedSaleTogether.includes(st.id)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedSaleTogether((prev) => [...prev, st.id]);
                    else setSelectedSaleTogether((prev) => prev.filter((id) => id !== st.id));
                  }}
                  className="w-4 h-4 accent-[#00a86b] rounded border-stone-300"
                />
                {st.images?.[0] && (
                  <Image
                    width={64}
                    height={64}
                    src={st.images[0]}
                    alt={st.title}
                    className="w-10 h-10 object-contain rounded-[2px] bg-white border border-stone-100"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-stone-800 truncate">{st.title}</div>
                  <div className="text-xs font-semibold text-[#e05246] tabular-nums">{formatPrice(st.price)}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Horizontal Utility Action Links: Vergleichen | Wunschliste | Fragen Sie uns | Teilen */}
      <div className="mt-4 pt-1 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px] text-stone-600">
        <button
          type="button"
          onClick={() => router.push('/compare')}
          className="inline-flex items-center gap-1.5 hover:text-[#00a86b] transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>{t('compare')}</span>
        </button>

        <button
          type="button"
          onClick={handleToggleWishlist}
          className={`inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
            isWishlisted ? 'text-[#e05246] font-medium' : 'hover:text-[#00a86b]'
          }`}
        >
          <svg
            className={`w-4 h-4 ${isWishlisted ? 'text-[#e05246]' : 'text-stone-600'}`}
            fill={isWishlisted ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>{isWishlisted ? t('remove_wishlist') : t('add_wishlist')}</span>
        </button>

        <button
          type="button"
          onClick={() => router.push(`/${contactSlug}`)}
          className="inline-flex items-center gap-1.5 hover:text-[#00a86b] transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t('ask_question')}</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 hover:text-[#00a86b] transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span>{shareCopied ? 'Link kopiert!' : 'Teilen'}</span>
        </button>
      </div>

      {/* Hairline Divider */}
      <hr className="my-4 border-stone-100" />

      {/* Live Viewers Indicator */}
      <div className="flex items-center gap-2 text-[12.5px] text-stone-600">
        <svg className="w-4 h-4 text-stone-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <span>
          <strong className="font-semibold text-stone-800">{viewerCount}</strong> Personen sehen sich das gerade an
        </span>
      </div>

      {/* Delivery & Free Shipping Checkmarks */}
      <div className="mt-3.5 space-y-2 text-[12.5px] text-stone-600">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>
            <strong className="font-semibold text-stone-700">Voraussichtliche Lieferzeit:</strong> Bis zu 4 Werktage
          </span>
        </div>
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>
            <strong className="font-semibold text-stone-700">Kostenloser Versand in Deutschland:</strong> Bei allen Bestellungen über 200 €
          </span>
        </div>
      </div>

      {/* Guaranteed Safe Checkout Payment Badges Box */}
      <div className="mt-5 bg-[#f9f9fa] border border-stone-200/70 rounded-[4px] px-4 py-3.5 text-center">
        <p className="text-[12px] font-medium text-stone-700 mb-2.5">
          Garantiert sichere und geschützte Kaufabwicklung
        </p>
        <div className="flex items-center justify-center flex-wrap gap-2" aria-label="Sichere Zahlungsmethoden">
          {/* VISA */}
          <span className="inline-flex items-center justify-center h-[22px] w-[36px] rounded-[2px] bg-[#1a1f71] text-white font-extrabold italic text-[10px] tracking-tight">
            VISA
          </span>
          {/* MasterCard */}
          <span className="inline-flex items-center justify-center h-[22px] w-[36px] rounded-[2px] bg-white border border-stone-200">
            <span className="w-3 h-3 rounded-full bg-[#eb001b] -mr-1.5" />
            <span className="w-3 h-3 rounded-full bg-[#f79e1b]/90" />
          </span>
          {/* AMEX */}
          <span className="inline-flex items-center justify-center h-[22px] w-[36px] rounded-[2px] bg-[#2e77bc] text-white font-bold text-[7px] leading-[1.05] text-center tracking-tighter">
            AMERICAN
            <br />
            EXPRESS
          </span>
          {/* DISCOVER */}
          <span className="inline-flex items-center justify-center h-[22px] w-[38px] rounded-[2px] bg-[#231f20] text-white font-bold text-[6.5px] tracking-tight px-1">
            <span>DISC</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#f47216] mx-[0.5px]" />
            <span>VER</span>
          </span>
          {/* PayPal */}
          <span className="inline-flex items-center justify-center h-[22px] px-1.5 rounded-[2px] bg-white border border-stone-200 font-bold italic text-[9px]">
            <span className="text-[#003087]">Pay</span>
            <span className="text-[#009cde]">Pal</span>
          </span>
          {/* Apple Pay */}
          <span className="inline-flex items-center justify-center h-[22px] px-1.5 rounded-[2px] bg-white border border-stone-200 text-stone-900 font-semibold text-[9px] gap-0.5">
            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 14 17" aria-hidden="true">
              <path d="M11.6 9.1c0-1.9 1.5-2.8 1.6-2.9-.9-1.3-2.2-1.5-2.7-1.5-1.1-.1-2.2.7-2.8.7-.6 0-1.5-.7-2.4-.7-1.2 0-2.4.7-3 1.9-1.3 2.3-.3 5.6.9 7.4.6.9 1.3 1.9 2.3 1.8.9 0 1.3-.6 2.4-.6s1.4.6 2.4.6c1 0 1.6-.9 2.2-1.8.7-1 1-2 1-2.1 0 0-1.9-.7-1.9-2.8zM9.7 3.4c.5-.6.9-1.5.8-2.4-.8 0-1.7.5-2.2 1.1-.5.6-.9 1.5-.8 2.3.9.1 1.7-.4 2.2-1z" />
            </svg>
            <span>Pay</span>
          </span>
        </div>
      </div>

      {/* Sticky Bottom Quick-Buy Bar (Desktop + Mobile, shown when scrolled past CTAs) */}
      {showStickyBar && (
        <aside
          aria-label="Schnellkauf"
          className="fixed bottom-[52px] lg:bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-stone-200 z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3 sm:gap-6">
            {/* Left: Thumb + Title */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {(currentVariation?.image || product.images?.[0]) && (
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-[3px] bg-white overflow-hidden shrink-0 border border-stone-200 flex items-center justify-center p-0.5">
                  <Image
                    src={currentVariation?.image || product.images[0]}
                    alt={product.title}
                    width={44}
                    height={44}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <p className="text-xs sm:text-[13.5px] font-medium text-stone-800 truncate">
                {product.title}
              </p>
            </div>

            {/* Right: Price + Stepper + Action Buttons */}
            <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
              <span className="text-xs sm:text-[15px] font-medium text-[#e05246] tabular-nums">
                {formatPrice(currentPrice)}
              </span>

              {/* Desktop Quantity Stepper */}
              <div className="hidden sm:flex items-center justify-between border border-stone-200 rounded-[4px] h-[38px] w-[96px] bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  aria-label="Menge verringern"
                  className="w-8 h-full flex items-center justify-center text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  −
                </button>
                <span className="text-[13px] font-medium text-stone-800 select-none">{quantity}</span>
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
                disabled={disablePurchase}
                className={`h-[38px] px-3.5 sm:px-5 rounded-[4px] font-semibold text-xs sm:text-[13px] transition-colors cursor-pointer whitespace-nowrap ${
                  disablePurchase
                    ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                    : 'bg-[#00a86b] hover:bg-[#008f5a] text-white'
                }`}
              >
                {isVariable && !currentVariation ? t('select_options_btn') : t('add_to_cart')}
              </button>

              {enableBuyNow && (
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={disablePurchase}
                  className={`hidden sm:inline-flex items-center justify-center h-[38px] px-5 rounded-[4px] font-semibold text-[13px] transition-colors cursor-pointer whitespace-nowrap ${
                    disablePurchase
                      ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                      : 'bg-[#00a86b] hover:bg-[#008f5a] text-white'
                  }`}
                >
                  {t('buy_now')}
                </button>
              )}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
