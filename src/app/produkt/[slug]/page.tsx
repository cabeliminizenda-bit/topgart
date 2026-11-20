/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '@/lib/prisma';
import { notFound, permanentRedirect } from 'next/navigation';
import Link from 'next/link';
import ProductPageClient from '@/components/product/ProductPageClient';
import Price from '@/components/Price';
import ProductReviews from '@/components/product/ProductReviews';
import ProductCard from '@/components/shop/ProductCard';
import StoreTrustCards from '@/components/common/StoreTrustCards';
import Newsletter from '@/components/home/Newsletter';
import { createClient } from '@/utils/supabase/server';
import { getTranslations } from 'next-intl/server';
import { safeJsonLd } from '@/lib/security';
import { Metadata } from 'next';
import { getCachedProductBySlug, getCachedSettings, getCachedRelatedProducts } from '@/lib/cache';
import { getCategoryCanonicalPath } from '@/lib/categories';
import { SITE_URL } from '@/lib/site';
import Image from 'next/image';

function RelatedStars({ rating }: { rating: number }) {
  const filledCount = Math.round(rating);
  return (
    <div className="flex items-center justify-center gap-0.5 my-1.5" aria-label={`Bewertung ${rating.toFixed(1)} von 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className="w-3.5 h-3.5 text-[#f5a623]"
          viewBox="0 0 20 20"
          fill={star <= filledCount ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;

  const product = await getCachedProductBySlug(slug);
  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'Top Gartengeräte';

  if (!product) {
    return {
      title: `Produkt nicht gefunden - ${storeName}`,
    };
  }

  return {
    title: product.metaTitle ? product.metaTitle : `${product.title} | ${storeName}`,
    description:
      product.metaDescription ||
      (product.shortDescription
        ? product.shortDescription.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').substring(0, 160)
        : '') ||
      (product.description
        ? product.description.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').substring(0, 160)
        : ''),
    alternates: {
      canonical: `/produkt/${product.slug}`,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const product = await getCachedProductBySlug(slug);

  if (!product) {
    return notFound();
  }

  // SEO Fallback: If URL slug differs from canonical product slug, 301 permanent redirect
  if (slug !== product.slug) {
    permanentRedirect(`/produkt/${product.slug}`);
  }

  const t = await getTranslations('Product');
  const settingsMap = await getCachedSettings();
  const enableBuyNow = settingsMap.ENABLE_BUY_NOW_BUTTON !== 'false';
  const shippingInfo = [
    settingsMap.SHIPPING_INFO_1 || 'Bis zu 4 Werktage',
    settingsMap.SHIPPING_INFO_2 || 'Bei allen Bestellungen über 200 €',
    settingsMap.SHIPPING_INFO_3 || 'Kostenlose Rückgabe innerhalb von 14 Tagen',
    settingsMap.SHIPPING_INFO_4 || '2 Jahre gesetzliche Gewährleistung & Top Gartengeräte Garantie',
  ];

  // Related products (same category)
  const categoryIds = (product as any).categories?.map((c: any) => c.id) || [];
  const relatedProducts = await getCachedRelatedProducts(categoryIds, product.id);

  // Lowest shipping rate for DE (default)
  const deZone = await prisma.shippingZone.findFirst({
    where: { name: { in: ['DE', 'Deutschland', 'Germany'] }, isActive: true },
    include: { methods: { where: { isActive: true }, orderBy: { rate: 'asc' } } },
  });
  const lowestShippingRate = deZone?.methods?.[0]?.rate ?? 0;

  // Canonical category path for SEO (Strip Category Base)
  const primaryCat = (product as any).categories?.[0];
  const primaryCatPath = primaryCat ? await getCategoryCanonicalPath(primaryCat) : null;

  // Check if logged in
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'Top Gartengeräte';

  const reviews = (product as any).reviews || [];
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((acc: number, curr: any) => acc + curr.rating, 0) / reviews.length
      : 0;

  const schemaJson: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: product.images || [],
    description:
      (product.description
        ? product.description.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ')
        : undefined) ||
      (product.shortDescription
        ? product.shortDescription.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ')
        : undefined),
    sku: product.id.split('-')[0].toUpperCase(),
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/produkt/${product.slug}`,
      priceCurrency: 'EUR',
      price: product.price,
      priceValidUntil: '2027-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability:
        product.stock && product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: storeName,
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'DE',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 14,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: lowestShippingRate,
          currency: 'EUR',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'DE',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 1,
            unitCode: 'd',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 2,
            maxValue: 4,
            unitCode: 'd',
          },
        },
      },
    },
  };

  if (reviews.length > 0) {
    schemaJson.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avgRating.toFixed(1),
      reviewCount: reviews.length,
    };
    schemaJson.review = reviews.map((r: any) => ({
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: r.rating,
      },
      author: {
        '@type': 'Person',
        name: r.reviewerName || 'Kunde',
      },
      reviewBody: r.comment || '',
      datePublished: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : undefined,
    }));
  }

  schemaJson.brand = {
    '@type': 'Brand',
    name: (product as any).brand?.name || storeName,
  };

  if ((product as any).gtin) {
    schemaJson.gtin = (product as any).gtin;
  }

  const breadcrumbItems = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Startseite',
      item: SITE_URL,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Shop',
      item: `${SITE_URL}/shop`,
    },
    ...(primaryCat
      ? [
          {
            '@type': 'ListItem',
            position: 3,
            name: primaryCat.name,
            item: `${SITE_URL}${primaryCatPath || `/${primaryCat.slug || primaryCat.id}`}`,
          },
        ]
      : []),
    {
      '@type': 'ListItem',
      position: primaryCat ? 4 : 3,
      name: product.title,
      item: `${SITE_URL}/produkt/${product.slug}`,
    },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-stone-800 flex flex-col">
      <main className="flex-grow pb-6">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd(schemaJson),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: breadcrumbItems,
            }),
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
          {/* Clean Inline Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="text-[12px] text-stone-500 flex items-center gap-1.5 flex-wrap mb-4 sm:mb-5"
          >
            <Link href="/" className="hover:text-[#00a86b] transition-colors">
              Startseite
            </Link>
            <span className="text-stone-400">/</span>
            <Link href="/shop" className="hover:text-[#00a86b] transition-colors">
              Shop
            </Link>
            {primaryCat && (
              <>
                <span className="text-stone-400">/</span>
                <Link
                  href={primaryCatPath || `/${primaryCat.slug || primaryCat.id}`}
                  className="hover:text-[#00a86b] transition-colors"
                >
                  {primaryCat.name}
                </Link>
              </>
            )}
            <span className="text-stone-400">/</span>
            <span className="text-stone-600 truncate max-w-[240px] sm:max-w-none">{product.title}</span>
          </nav>

          <div id="cart-notification-portal"></div>

          {/* Main 2-Column Product Hero */}
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
            <ProductPageClient
              product={product as any}
              enableBuyNow={enableBuyNow}
              storeName={storeName}
              shippingInfo={shippingInfo}
              contactSlug={settingsMap.CONTACT_SLUG || 'kontakt'}
              translations={{
                sku: t('sku'),
                categories: t('categories'),
                tags: t('tags'),
                sold: t('sold'),
                customer_reviews: t('customer_reviews', { count: (product as any).reviews?.length || 0 }),
                uncategorized: t('uncategorized'),
                brand: t('brand'),
              }}
            />
          </div>

          {/* Description & Reviews Tabs Card */}
          <ProductReviews
            productId={product.id}
            productTitle={product.title}
            reviews={(product as any).reviews || []}
            description={product.description}
            isLoggedIn={isLoggedIn}
          />

          {/* 3 Trust Feature Cards (Kostenlose Rückgabe, Lieferung, Erstkunden-Rabatt) */}
          <div className="mt-10 sm:mt-12">
            <StoreTrustCards couponCode={settingsMap.COUPON_CODE || 'GUT727AG'} />
          </div>

          {/* Related Products Section */}
          <section className="mt-10 sm:mt-12">
            <h2 className="text-[19px] font-semibold text-stone-800 mb-4">
              {t('related_products')}
            </h2>

            {relatedProducts.length > 0 ? (
              <div className="bg-[#f9f9fa] border border-stone-200/90 rounded-[6px] p-4 sm:p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {relatedProducts.map((rp: any) => (
                    <ProductCard
                      key={rp.id}
                      product={{
                        id: rp.id,
                        title: rp.title,
                        slug: rp.slug,
                        price: rp.price,
                        compareAtPrice: rp.compareAtPrice,
                        images: rp.images || [],
                        discountLabel: rp.discountLabel,
                        categories: rp.categories || [],
                        reviews: rp.reviews || [],
                        type: rp.type,
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-stone-500 text-sm">Keine ähnlichen Produkte gefunden.</p>
            )}
          </section>
        </div>

        {/* Newsletter Bar right above Footer */}
        <Newsletter />
      </main>
    </div>
  );
}
