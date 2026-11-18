'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Price from '@/components/Price';
import QuickViewModal from '@/components/product/QuickViewModal';
import ProductCardActionButtons from '@/components/product/ProductCardActionButtons';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { toast } from 'react-hot-toast';
import { useTranslations } from 'next-intl';

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    slug: string;
    price: number;
    compareAtPrice?: number | null;
    images: string[];
    discountLabel?: string | null;
    categories?: { name: string; slug?: string | null }[] | null;
    reviews?: { rating: number }[];
    type?: string;
  };
  view?: 'grid' | 'list';
  cardStyle?: 'design1' | 'design2';
  borderColor?: string;
}

const Star = ({ filled = false }: { filled?: boolean }) => (
  <svg
    className="w-3.5 h-3.5 text-[#f5a623]"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={1.5}
    viewBox="0 0 20 20"
    aria-hidden="true"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

export default function ProductCard({
  product,
  view = 'grid',
  borderColor,
}: ProductCardProps) {
  const router = useRouter();
  const image = product.images?.[0] || '';
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const cartStore = useCartStore();
  const wishlistStore = useWishlistStore();
  const isWishlisted = wishlistStore.hasItem(product.id);
  const t = useTranslations('ProductCard');

  const reviews = product.reviews || [];
  const ratingCount = reviews.length;
  const avgRating = ratingCount > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / ratingCount : 0;
  const filledStars = Math.round(avgRating);

  const isVariable = product.type?.toUpperCase() === 'VARIABLE';

  const hasDiscount = Boolean(product.compareAtPrice && product.compareAtPrice > product.price);
  const computedDiscountBadge =
    product.discountLabel ||
    (hasDiscount && product.compareAtPrice
      ? `-${Math.round((1 - product.price / product.compareAtPrice) * 100)}%`
      : null);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isVariable) {
      router.push(`/produkt/${product.slug}`);
      return;
    }
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

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    wishlistStore.toggleItem(product.id);
    if (!isWishlisted) {
      wishlistStore.setIsOpen(true);
    } else {
      toast.success(t('removed_from_wishlist'));
    }
  };

  const actionButtons = (
    <ProductCardActionButtons
      isWishlisted={isWishlisted}
      onToggleWishlist={handleToggleWishlist}
      onQuickView={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsQuickViewOpen(true);
      }}
      wishlistTitle={
        isWishlisted
          ? t('removed_from_wishlist') || 'Von der Wunschliste entfernen'
          : t('add_to_wishlist') || 'Zur Wunschliste hinzufügen'
      }
      quickViewTitle={t('quick_view') || 'Schnellansicht'}
      positionClassName="top-2.5 right-2.5"
      buttonSizeClassName="w-9 h-9"
    />
  );

  const placeholderSvg = (
    <div className="w-16 h-16 rounded-full bg-stone-50 flex items-center justify-center text-stone-300">
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    </div>
  );

  if (view === 'list') {
    return (
      <div
        onClick={() => router.push(`/produkt/${product.slug}`)}
        className="group flex flex-col sm:flex-row bg-white border border-stone-200 rounded-[4px] overflow-hidden hover:border-[#00a86b]/55 hover:shadow-sm transition-all duration-200 cursor-pointer"
        style={borderColor ? { borderColor } : {}}
      >
        <div className="relative h-52 sm:h-auto sm:w-56 shrink-0 bg-white flex items-center justify-center p-4 border-b sm:border-b-0 sm:border-r border-stone-100 overflow-hidden">
          {computedDiscountBadge && hasDiscount && (
            <span className="absolute top-2.5 left-2.5 bg-[#e05246] text-white text-[11px] font-semibold px-2 py-0.5 rounded-[3px] z-20">
              {computedDiscountBadge}
            </span>
          )}

          {actionButtons}

          {image ? (
            <Image
              src={image}
              alt={product.title}
              title={product.title}
              width={400}
              height={400}
              sizes="(max-width: 640px) 100vw, 224px"
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            placeholderSvg
          )}
        </div>

        <div className="p-5 flex flex-col flex-grow">
          {product.categories && product.categories.length > 0 && (
            <span className="text-[11.5px] text-stone-400 mb-1.5 z-20 relative">
              {product.categories.map((c, idx) => (
                <span key={idx}>
                  <Link
                    href={`/product-category/${c.slug}`}
                    className="hover:text-[#00a86b] hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {c.name}
                  </Link>
                  {idx < product.categories!.length - 1 ? ', ' : ''}
                </span>
              ))}
            </span>
          )}

          <h3 className="text-[16px] font-medium text-stone-800 mb-2 leading-snug transition-colors">
            <Link
              href={`/produkt/${product.slug}`}
              className="hover:text-[#00a86b]"
              onClick={(e) => e.stopPropagation()}
            >
              {product.title}
            </Link>
          </h3>

          <div className="flex items-center gap-0.5 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} filled={i < filledStars} />
            ))}
            {ratingCount > 0 && (
              <span className="text-[11px] text-stone-400 ml-1">({ratingCount})</span>
            )}
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-baseline gap-2.5">
              {hasDiscount && product.compareAtPrice && (
                <span className="text-[13.5px] text-stone-400 line-through tabular-nums">
                  <Price amount={product.compareAtPrice} />
                </span>
              )}
              <span className="text-[18px] font-medium text-[#e05246] tabular-nums">
                <Price amount={product.price} />
              </span>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="bg-[#00a86b] hover:bg-[#008f5a] text-white font-semibold text-[13px] px-5 h-[38px] rounded-[4px] transition-colors cursor-pointer"
            >
              {isVariable ? t('select_options') || 'Optionen wählen' : t('add_to_cart') || 'In den Warenkorb'}
            </button>
          </div>
        </div>
        <QuickViewModal isOpen={isQuickViewOpen} onClose={() => setIsQuickViewOpen(false)} product={product} />
      </div>
    );
  }

  return (
    <div
      onClick={() => router.push(`/produkt/${product.slug}`)}
      className="group flex flex-col h-full bg-white border border-stone-200 rounded-[4px] overflow-hidden hover:border-[#00a86b]/55 hover:shadow-sm transition-all duration-200 cursor-pointer"
      style={borderColor ? { borderColor } : {}}
    >
      {/* Image Area */}
      <div className="relative h-52 w-full bg-white flex items-center justify-center p-4 overflow-hidden">
        {computedDiscountBadge && hasDiscount && (
          <span className="absolute top-2.5 left-2.5 bg-[#e05246] text-white text-[11px] font-semibold px-2 py-0.5 rounded-[3px] z-20">
            {computedDiscountBadge}
          </span>
        )}

        {/* Only Wishlist + Quick View (no Compare icon) */}
        {actionButtons}

        {image ? (
          <Image
            src={image}
            alt={product.title}
            title={product.title}
            width={420}
            height={420}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 250px"
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          placeholderSvg
        )}
      </div>

      {/* Centered Product Details matching Top Gartengeräte Card Design */}
      <div className="px-4 pb-4 pt-1 flex flex-col flex-grow items-center text-center">
        <h3
          className="text-[13.5px] font-medium text-stone-800 leading-snug line-clamp-3 min-h-[3.6rem] mb-2 transition-colors"
          title={product.title}
        >
          <Link
            href={`/produkt/${product.slug}`}
            className="hover:text-[#00a86b] transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {product.title}
          </Link>
        </h3>

        {/* Centered 5 Golden Stars */}
        <div className="flex items-center justify-center gap-0.5 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} filled={i < filledStars} />
          ))}
        </div>

        {/* Centered Price Row */}
        <div className="flex items-center justify-center gap-2 mb-3.5">
          {hasDiscount && product.compareAtPrice && (
            <span className="text-[13px] text-stone-400 line-through tabular-nums">
              <Price amount={product.compareAtPrice} />
            </span>
          )}
          <span className="text-[15.5px] font-medium text-[#e05246] tabular-nums">
            <Price amount={product.price} />
          </span>
        </div>

        {/* Full-Width Emerald Green CTA Button */}
        <button
          type="button"
          onClick={handleAddToCart}
          className="mt-auto w-full h-[38px] bg-[#00a86b] hover:bg-[#008f5a] active:bg-[#007a4d] text-white font-semibold text-[13px] rounded-[4px] transition-colors cursor-pointer"
        >
          {isVariable ? t('select_options') || 'Optionen wählen' : t('add_to_cart') || 'In den Warenkorb'}
        </button>
      </div>

      <QuickViewModal isOpen={isQuickViewOpen} onClose={() => setIsQuickViewOpen(false)} product={product} />
    </div>
  );
}
