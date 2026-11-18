/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import ProductGallery from './ProductGallery';
import ProductActions from './ProductActions';
import Link from 'next/link';

interface ProductPageClientProps {
  product: {
    id: string;
    slug?: string;
    title: string;
    shortDescription?: string | null;
    price: number;
    compareAtPrice?: number | null;
    discountLabel?: string | null;
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
    brand?: { name: string; logo?: string | null } | null;
    categories?: { id: string; name: string; slug?: string | null }[];
    tags?: { id?: string; name: string; slug?: string | null }[];
    reviews?: { rating: number }[];
    gtin?: string | null;
    [key: string]: any;
  };
  enableBuyNow?: boolean;
  storeName?: string;
  translations?: {
    sku: string;
    categories: string;
    tags: string;
    sold: string;
    customer_reviews: string;
    uncategorized: string;
    brand: string;
  };
  shippingInfo?: string[];
  contactSlug?: string;
}

export default function ProductPageClient({
  product,
  enableBuyNow = true,
  translations,
  shippingInfo,
  contactSlug = 'kontakt',
}: ProductPageClientProps) {
  const [variationImage, setVariationImage] = useState<string | null>(null);
  const t = translations;

  return (
    <>
      {/* Left: Vertical Thumbnail Strip + Large Bordered Main Image */}
      <ProductGallery
        images={product.images}
        title={product.title}
        discountLabel={product.discountLabel}
        compareAtPrice={product.compareAtPrice}
        price={product.price}
        activeVariationImage={variationImage}
      />

      {/* Right: Product Info & Conversion Column */}
      <div className="w-full lg:w-[51%] flex flex-col">
        <h1 className="text-[21px] sm:text-[23px] font-medium text-stone-800 leading-snug mb-2">
          {product.title}
        </h1>

        <ProductActions
          product={product as any}
          reviews={product.reviews || []}
          enableBuyNow={enableBuyNow}
          onVariationChange={(image: string | null) => setVariationImage(image)}
          shippingInfo={shippingInfo}
          contactSlug={contactSlug}
        />

        {/* Subtle Compact Product Metadata (SKU, Categories, Brand, GTIN) */}
        <div className="mt-5 pt-3.5 border-t border-stone-100 flex flex-wrap gap-x-5 gap-y-1.5 text-[11.5px] text-stone-500">
          <span>
            <strong className="font-medium text-stone-700">{t?.sku ?? 'Artikelnummer:'}</strong>{' '}
            {product.id.split('-')[0].toUpperCase()}
          </span>
          {product.categories && product.categories.length > 0 && (
            <span>
              <strong className="font-medium text-stone-700">{t?.categories ?? 'Kategorien:'}</strong>{' '}
              {product.categories.map((c: any, index: number) => (
                <span key={c.id}>
                  <Link
                    href={`/${c.slug || c.id}`}
                    className="hover:text-[#00a86b] hover:underline transition-colors"
                  >
                    {c.name}
                  </Link>
                  {index < product.categories!.length - 1 ? ', ' : ''}
                </span>
              ))}
            </span>
          )}
          {product.brand && (
            <span>
              <strong className="font-medium text-stone-700">{t?.brand ?? 'Marke:'}</strong>{' '}
              {product.brand.name}
            </span>
          )}
          {product.gtin && (
            <span>
              <strong className="font-medium text-stone-700">GTIN / EAN:</strong>{' '}
              <span className="font-mono">{product.gtin}</span>
            </span>
          )}
        </div>
      </div>
    </>
  );
}
