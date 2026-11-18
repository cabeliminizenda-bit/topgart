/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useWishlistStore } from '@/store/wishlistStore';
import { getProductsByIds } from '@/actions/public';
import Link from 'next/link';
import Price from '@/components/Price';
import { useCartStore } from '@/store/cartStore';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

export default function WishlistClient() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const wishlistItems = useWishlistStore((state) => state.items);
  const toggleItem = useWishlistStore((state) => state.toggleItem);
  const cartStore = useCartStore();
  const t = useTranslations('Wishlist');

  useEffect(() => {
    async function loadWishlist() {
      if (wishlistItems.length === 0) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      try {
        const fetchedProducts = await getProductsByIds(wishlistItems);
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Fehler beim Laden der Wunschliste', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadWishlist();
  }, [wishlistItems]);

  const handleAddToCart = (product: any) => {
    const image = product.images && product.images.length > 0 ? product.images[0] : '';
    cartStore.addItem({
      id: product.id,
      productId: product.id,
      slug: product.slug,
      title: product.title,
      price: product.price,
      image,
      quantity: 1,
    });
    cartStore.setIsOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#00a86b]"></div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-[#f9f9fa] rounded-[4px] p-10 text-center border border-stone-200">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-300">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-stone-800 mb-2">{t('empty_title')}</h2>
        <p className="text-sm text-stone-500 mb-6">{t('empty_subtitle')}</p>
        <Link
          href="/shop"
          className="inline-block bg-[#00a86b] hover:bg-[#008f5a] text-white font-semibold text-sm px-6 py-2.5 rounded-[4px] transition-colors"
        >
          {t('discover_products')}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((p) => (
        <div
          key={p.id}
          className="bg-white border border-stone-200 rounded-[4px] overflow-hidden hover:border-[#00a86b]/55 hover:shadow-sm transition group flex flex-col"
        >
          <div className="relative bg-white h-52 p-4 flex items-center justify-center">
            <button
              type="button"
              onClick={() => toggleItem(p.id)}
              className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-stone-100 hover:bg-[#e05246] text-stone-500 hover:text-white flex items-center justify-center transition-colors cursor-pointer z-10"
              title={t('remove')}
              aria-label={t('remove')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <Link href={`/produkt/${p.slug}`} className="w-full h-full flex items-center justify-center">
              {p.images && p.images.length > 0 ? (
                <Image
                  width={400}
                  height={400}
                  src={p.images[0]}
                  alt={p.title}
                  className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-300"
                />
              ) : (
                <svg className="w-12 h-12 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </Link>
          </div>
          <div className="px-4 pb-4 pt-1 flex flex-col flex-1 items-center text-center">
            <Link href={`/produkt/${p.slug}`} className="w-full">
              <h3 className="text-[13.5px] font-medium text-stone-800 line-clamp-2 min-h-[2.6rem] mb-2 hover:text-[#00a86b] transition-colors">
                {p.title}
              </h3>
            </Link>
            <div className="mb-3.5">
              <Price amount={p.price} className="font-medium text-[15.5px] text-[#e05246] tabular-nums" />
            </div>

            <button
              type="button"
              onClick={() => handleAddToCart(p)}
              className="mt-auto w-full h-[38px] bg-[#00a86b] hover:bg-[#008f5a] text-white text-[13px] font-semibold rounded-[4px] transition-colors cursor-pointer"
            >
              {t('add_to_cart')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
