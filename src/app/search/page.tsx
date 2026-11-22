import prisma from '@/lib/prisma';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import ProductCard from '@/components/shop/ProductCard';
import { resolveCategoryFilter } from '@/lib/categories';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Suche | Top Gartengeräte',
  robots: {
    index: false,
    follow: true,
  },
};

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams;
  const q = typeof resolvedParams.q === 'string' ? resolvedParams.q.trim() : '';
  const rawCategory = typeof resolvedParams.category === 'string' ? resolvedParams.category.trim() : 'all';
  const hasCategoryFilter = Boolean(rawCategory && rawCategory !== 'all');

  const where: Record<string, unknown> = {
    isDeleted: false,
  };

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];
  }

  let resolvedCategoryName = '';
  let categoryNotFound = false;

  if (hasCategoryFilter) {
    const { category: matchedCategory, ids } = await resolveCategoryFilter(rawCategory);
    if (matchedCategory && ids.length > 0) {
      resolvedCategoryName = matchedCategory.name;
      where.categories = { some: { id: { in: ids } } };
    } else {
      categoryNotFound = true;
    }
  }

  const [products, settingsDb, t] = await Promise.all([
    categoryNotFound
      ? Promise.resolve([])
      : prisma.product.findMany({
        where,
        take: 48,
        select: {
          id: true,
          title: true,
          slug: true,
          price: true,
          compareAtPrice: true,
          images: true,
          discountLabel: true,
          type: true,
          categories: { select: { name: true, slug: true } },
          reviews: { where: { isApproved: true }, select: { rating: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    prisma.setting.findMany({
      where: { key: { in: ['SHOP_CARD_STYLE', 'SHOP_CARD_BORDER_COLOR'] } },
    }),
    getTranslations('Search'),
  ]);

  const settingsMap = settingsDb.reduce(
    (acc, s) => ({ ...acc, [s.key]: s.value }),
    {} as Record<string, string>
  );
  const cardStyle = (settingsMap.SHOP_CARD_STYLE as 'design1' | 'design2') || 'design2';
  const borderColor = settingsMap.SHOP_CARD_BORDER_COLOR || '';

  return (
    <div className="bg-white min-h-screen py-8 font-sans text-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-[22px] sm:text-[26px] font-semibold text-stone-800 mb-1.5">{t('search_results')}</h1>
        <p className="text-sm text-stone-500 mb-7">
          {q ? (
            <>
              {t('products_found', { count: products.length, q })}
              {hasCategoryFilter
                ? resolvedCategoryName
                  ? ` ${t('in_category_named', { category: resolvedCategoryName })}`
                  : ` ${t('in_category')}`
                : ''}
            </>
          ) : hasCategoryFilter ? (
            t('products_found_category', {
              count: products.length,
              category: resolvedCategoryName || rawCategory,
            })
          ) : (
            `${products.length}`
          )}
        </p>

        {products.length === 0 ? (
          <div className="bg-[#f9f9fa] p-12 text-center rounded-[4px] border border-stone-200">
            <svg className="w-14 h-14 text-stone-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-lg font-semibold text-stone-800 mb-2">{t('no_results')}</h2>
            <p className="text-sm text-stone-500 mb-6">{t('no_products_match')}</p>
            <Link href="/" className="inline-block bg-[#00a86b] hover:bg-[#008f5a] text-white font-semibold text-sm px-6 py-2.5 rounded-[4px] transition-colors">
              {t('back_to_home')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                view="grid"
                cardStyle={cardStyle}
                borderColor={borderColor}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
