/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import Price from '@/components/Price';
import { useCurrency } from '@/components/CurrencyProvider';
import { useTranslations } from 'next-intl';
import { validateCoupon } from '@/actions/checkout';
import { DEFAULT_GERMANY_FREE_SHIPPING_THRESHOLD } from '@/lib/shipping';
import Image from 'next/image';

type CartDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  freeShippingThreshold?: number;
};

export default function CartDrawer({
  isOpen,
  onClose,
  freeShippingThreshold = DEFAULT_GERMANY_FREE_SHIPPING_THRESHOLD,
}: CartDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice, getTotalItems, coupon, setCoupon } =
    useCartStore();
  const [showCoupon, setShowCoupon] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const t = useTranslations('CartDrawer');
  const { formatPrice } = useCurrency();

  const cartTotal = getTotalPrice();
  let discountAmount = 0;
  if (coupon) {
    if (coupon.type === 'PERCENTAGE') {
      discountAmount = cartTotal * (coupon.value / 100);
    } else {
      discountAmount = coupon.value;
    }
  }
  const finalTotal = Math.max(0, cartTotal - discountAmount);

  const handleApplyCoupon = async () => {
    setCouponError('');
    if (!couponCode) return;

    setIsApplying(true);
    const res = await validateCoupon(couponCode);
    if (res.error) {
      setCouponError(res.error);
      setCoupon(null);
    } else if (res.coupon) {
      setCoupon(res.coupon as any);
      setShowCoupon(false);
    }
    setIsApplying(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-[101] w-full sm:w-[400px] h-full bg-white shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
          <div className="flex items-center">
            <div className="relative mr-3">
              <svg className="w-6 h-6 text-stone-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="absolute -top-1.5 -right-2 bg-[#00a86b] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.2rem] text-center leading-none">
                {getTotalItems()}
              </span>
            </div>
            <h2 className="text-[18px] font-semibold text-stone-800">{t('title')}</h2>
          </div>

          <div className="flex items-center gap-3">
            {items.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs text-stone-500 hover:text-[#e05246] transition-colors cursor-pointer"
              >
                {t('clear_all')}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label={t('close') || 'Schließen'}
              className="p-1.5 rounded-[4px] bg-stone-100 text-stone-600 hover:bg-stone-200 transition cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col">
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-28 h-28 mb-5 rounded-full bg-[#f4f5f6] flex items-center justify-center text-stone-300">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="text-stone-700 font-medium text-sm mb-5">{t('empty_cart')}</p>
              <button
                type="button"
                onClick={onClose}
                className="bg-[#00a86b] hover:bg-[#008f5a] text-white font-semibold text-sm py-2.5 px-7 rounded-[4px] transition-colors cursor-pointer"
              >
                {t('continue_shopping')}
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3.5 border-b border-stone-100 pb-4">
                  <div className="w-20 h-20 bg-white border border-stone-200 shrink-0 rounded-[4px] flex items-center justify-center relative overflow-hidden">
                    {item.image ? (
                      <Image
                        width={160}
                        height={160}
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-contain p-1.5"
                      />
                    ) : (
                      <span className="text-[11px] text-stone-400">{t('no_image')}</span>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col min-w-0">
                    <Link
                      href={`/produkt/${item.slug || item.productId}`}
                      onClick={onClose}
                      className="font-medium text-stone-800 text-[13px] hover:text-[#00a86b] line-clamp-2 leading-snug mb-2 transition-colors"
                    >
                      {item.title}
                    </Link>

                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center border border-stone-200 rounded-[4px] bg-white">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label="Menge verringern"
                          className="w-7 h-7 flex items-center justify-center hover:bg-stone-50 text-stone-600 transition cursor-pointer"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value, 10) || 1)}
                          aria-label="Menge"
                          className="w-9 h-7 text-center text-xs font-medium text-stone-800 outline-none border-x border-stone-200"
                        />
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label="Menge erhöhen"
                          className="w-7 h-7 flex items-center justify-center hover:bg-stone-50 text-stone-600 transition cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <Price amount={item.price * item.quantity} className="font-semibold text-[14px] text-[#e05246] tabular-nums" />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-[11.5px] text-stone-400 hover:text-[#e05246] flex items-center mt-2.5 self-end transition-colors cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {t('remove')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer (Totals & CTA) */}
        <div className="p-5 bg-white border-t border-stone-200 mt-auto">
          {items.length > 0 && freeShippingThreshold > 0 && (
            <div className="mb-3.5 rounded-[4px] border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-xs">
              {Math.round(cartTotal * 100) >= Math.round(freeShippingThreshold * 100) ? (
                <p className="font-medium text-[#00a86b]">
                  ✓ Kostenloser Versand in Deutschland freigeschaltet!
                </p>
              ) : (
                <>
                  <p className="text-stone-700 mb-1.5">
                    Noch <strong>{formatPrice(Math.max(0, Math.round((freeShippingThreshold - cartTotal) * 100) / 100))}</strong> bis zum kostenlosen Versand in Deutschland (ab {formatPrice(freeShippingThreshold)})
                  </p>
                  <div className="w-full h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#00a86b] transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.round((cartTotal / freeShippingThreshold) * 100))}%` }}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Coupon */}
          <div className="mb-3.5">
            <button
              type="button"
              onClick={() => setShowCoupon(!showCoupon)}
              className="flex items-center text-xs text-stone-600 hover:text-[#00a86b] transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 mr-1.5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              <span className="font-semibold text-[#00a86b] mr-1">{t('click_here')}</span> {t('apply_coupon_text')}
            </button>
            {showCoupon && (
              <div className="mt-2.5 flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder={t('coupon_placeholder')}
                    className="flex-1 px-3 py-2 border border-stone-200 rounded-[4px] text-xs outline-none focus:border-[#00a86b] uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={isApplying}
                    className="px-4 py-2 bg-[#00a86b] hover:bg-[#008f5a] text-white text-xs font-semibold rounded-[4px] transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isApplying ? '...' : t('apply_btn')}
                  </button>
                </div>
                {couponError && <p className="text-xs text-[#e05246]">{couponError}</p>}
              </div>
            )}
          </div>

          <div className="border border-stone-200 bg-[#fafafa] rounded-[4px] p-3.5 mb-4">
            <div className="flex justify-between items-center text-sm mb-1.5">
              <span className="text-stone-600">{t('subtotal')}</span>
              <Price amount={cartTotal} className={coupon ? 'text-stone-400 line-through tabular-nums' : 'text-stone-800 font-medium tabular-nums'} />
            </div>
            {coupon && (
              <div className="flex justify-between items-center text-xs mb-1.5 text-[#00a86b]">
                <span className="font-medium flex items-center gap-1">
                  Gutschein ({coupon.code})
                  <button type="button" onClick={() => setCoupon(null)} className="text-[#e05246] hover:underline ml-1 cursor-pointer">
                    Entfernen
                  </button>
                </span>
                <Price amount={-discountAmount} className="tabular-nums" />
              </div>
            )}
            <div className="flex justify-between items-center text-[16px] font-semibold border-t border-stone-200 mt-2 pt-2">
              <span className="text-stone-800">{t('total')}</span>
              <Price amount={finalTotal} className="text-[#e05246] tabular-nums" />
            </div>
          </div>

          <div className="flex gap-2.5">
            <Link
              href="/cart"
              onClick={onClose}
              className="flex-1 flex justify-center items-center h-[42px] px-4 bg-[#f4f5f6] hover:bg-stone-200 text-stone-800 font-semibold text-xs sm:text-[13px] rounded-[4px] transition-colors"
            >
              {t('view_cart')}
            </Link>
            <Link
              href="/checkout"
              onClick={onClose}
              className="flex-1 flex justify-center items-center h-[42px] px-4 bg-[#00a86b] hover:bg-[#008f5a] text-white font-semibold text-xs sm:text-[13px] rounded-[4px] transition-colors"
            >
              {t('checkout')}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
