import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';
import { isSensitiveSettingKey } from '@/lib/security';

// ==========================================
// 1. REUSABLE LEAN PROJECTIONS (ANTI-EGRESS)
// ==========================================
export const productCardSelect = {
  id: true,
  title: true,
  slug: true,
  price: true,
  compareAtPrice: true,
  images: true,
  stock: true,
  discountLabel: true,
  isBestSeller: true,
  type: true,
  gtin: true,
  brand: { select: { name: true } },
  categories: { select: { name: true, slug: true } },
  reviews: { where: { isApproved: true }, select: { rating: true } },
} as const;

// ==========================================
// 2. SETTINGS CACHE
// ==========================================
// Helper to get raw public settings (excluding all credentials, PII, and internal drafts)
async function fetchSettings() {
  const settingsDb = await prisma.setting.findMany();
  return settingsDb
    .filter(s => !isSensitiveSettingKey(s.key))
    .reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);
}

// Cached version of settings (1h TTL + instant tag invalidation)
export const getCachedSettings = unstable_cache(
  async () => fetchSettings(),
  ['global-settings'],
  { tags: ['settings'], revalidate: 3600 }
);

// ==========================================
// 3. PRODUCT CACHE (SINGLE & RELATED)
// ==========================================
export const getCachedProductBySlug = async (slug: string) => {
  return unstable_cache(
    async () => {
      const encodedSlugLower = encodeURIComponent(slug).toLowerCase();
      const encodedSlugUpper = encodeURIComponent(slug);
      let decodedSlug = slug;
      try { decodedSlug = decodeURIComponent(slug); } catch (e) {}

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slug);

      let product = await prisma.product.findFirst({
        where: { 
          isDeleted: false,
          OR: [
            { slug: slug },
            { slug: encodedSlugLower },
            { slug: encodedSlugUpper },
            { slug: decodedSlug },
            ...(isUuid ? [{ id: slug }] : [])
          ]
        },
        include: {
          categories: true,
          Product_ForceSales_A: true,
          Product_SaleTogether_A: true,
          brand: true,
          tags: true,
          reviews: {
            where: { isApproved: true },
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { email: true } } }
          }
        }
      });

      // SEO Migration Fallback 1: If not found, check if a product exists with slug matching `${decodedSlug}-*` (suffix appended during WP/WooCommerce import)
      if (!product) {
        product = await prisma.product.findFirst({
          where: {
            isDeleted: false,
            slug: {
              startsWith: `${decodedSlug}-`
            }
          },
          include: {
            categories: true,
            Product_ForceSales_A: true,
            Product_SaleTogether_A: true,
            brand: true,
            tags: true,
            reviews: {
              where: { isApproved: true },
              orderBy: { createdAt: 'desc' },
              include: { user: { select: { email: true } } }
            }
          }
        });
      }

      // SEO Migration Fallback 2: If not found and input slug ends with numeric suffix (e.g. `-481`), check without suffix
      if (!product && /-\d+$/.test(decodedSlug)) {
        const strippedSlug = decodedSlug.replace(/-\d+$/, '');
        product = await prisma.product.findFirst({
          where: {
            isDeleted: false,
            slug: strippedSlug
          },
          include: {
            categories: true,
            Product_ForceSales_A: true,
            Product_SaleTogether_A: true,
            brand: true,
            tags: true,
            reviews: {
              where: { isApproved: true },
              orderBy: { createdAt: 'desc' },
              include: { user: { select: { email: true } } }
            }
          }
        });
      }

      if (!product) return null;

      // RGPD: Never leak raw emails to client RSC payload
      const sanitizedReviews = product.reviews.map(r => ({
        id: r.id,
        productId: r.productId,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        reviewerName: r.reviewerName || (r.user?.email ? r.user.email.split('@')[0] : 'Kunde'),
      }));

      return {
        ...product,
        reviews: sanitizedReviews,
      };
    },
    ['product-details', slug],
    { tags: ['products', `product-${slug}`], revalidate: 3600 }
  )();
};

export const getCachedRelatedProducts = async (categoryIds: string[], excludeProductId: string) => {
  // Sort IDs so the cache key is consistent
  const sortedIds = [...categoryIds].sort();
  return unstable_cache(
    async () => prisma.product.findMany({
      where: {
        isDeleted: false,
        categories: { some: { id: { in: categoryIds } } },
        id: { not: excludeProductId }
      },
      select: productCardSelect,
      take: 4,
    }),
    ['related-products', sortedIds.join(','), excludeProductId],
    { tags: ['products'], revalidate: 3600 }
  )();
};

// ==========================================
// 4. HOMEPAGE PRODUCTS & BESTSELLERS
// ==========================================
export const getCachedHomepageProducts = unstable_cache(
  async () => {
    const allDbProds = await prisma.product.findMany({
      where: { isDeleted: false },
      take: 60,
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        compareAtPrice: true,
        images: true,
        discountLabel: true,
        isBestSeller: true,
        gtin: true,
        brand: { select: { name: true } },
        categories: { select: { name: true, slug: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedProducts = allDbProds.map(p => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      images: (p.images || []).slice(0, 2),
      discountLabel: p.discountLabel || (p.compareAtPrice && p.compareAtPrice > p.price ? `-${Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100)}%` : null),
      categorySlug: p.categories[0]?.slug || '',
      categoryName: p.categories[0]?.name || '',
      categories: p.categories.map(c => ({ name: c.name, slug: c.slug || '' })),
      allCategories: p.categories.map(c => `${c.name} ${c.slug}`).join(' ')
    }));

    const detectedBestsellers = allDbProds
      .filter(p => p.isBestSeller)
      .concat(allDbProds.filter(p => !p.isBestSeller && p.images && p.images.length > 0))
      .slice(0, 6)
      .map((p, idx) => ({
        id: p.id,
        title: p.title,
        price: `${p.price.toFixed(2).replace('.', ',')}€`,
        rawPrice: p.price,
        image: p.images?.[0] || '/images/deals/bestseller-1.jpg',
        slug: p.slug,
        rank: idx + 1,
        energyRating: p.title.match(/\b([A-G]|\bA\+{1,3})\b/i)?.[1]?.toUpperCase() || undefined,
        rating: 5,
        ratingScore: '(5.00)'
      }));

    return {
      formattedProducts,
      dbBestsellers: detectedBestsellers
    };
  },
  ['homepage-products-v3'],
  { tags: ['products', 'homepage'], revalidate: 3600 }
);

// Caching for Homepage best sellers (stand-alone)
export const getCachedBestSellers = unstable_cache(
  async () => prisma.product.findMany({
    where: { isBestSeller: true, isDeleted: false },
    take: 8,
    select: productCardSelect
  }),
  ['home-best-sellers'],
  { tags: ['products'], revalidate: 3600 }
);

// Caching for Homepage latest products (stand-alone)
export const getCachedLatestProducts = unstable_cache(
  async () => prisma.product.findMany({
    where: { isDeleted: false },
    take: 8,
    orderBy: { createdAt: 'desc' },
    select: productCardSelect
  }),
  ['home-latest-products'],
  { tags: ['products'], revalidate: 3600 }
);

// ==========================================
// 5. CATALOG SECTIONS (HOT / NEW / SALE)
// ==========================================
export const getCachedHotProducts = unstable_cache(
  async () => prisma.product.findMany({
    select: productCardSelect,
    orderBy: {
      orderItems: {
        _count: 'desc'
      }
    },
    take: 40
  }),
  ['hot-products-page'],
  { tags: ['products'], revalidate: 3600 }
);

export const getCachedNewProducts = unstable_cache(
  async () => prisma.product.findMany({
    select: productCardSelect,
    orderBy: { createdAt: 'desc' },
    take: 40
  }),
  ['new-products-page'],
  { tags: ['products'], revalidate: 3600 }
);

export const getCachedSaleProducts = unstable_cache(
  async () => prisma.product.findMany({
    where: {
      isDeleted: false,
      compareAtPrice: { gt: 0 }
    },
    select: productCardSelect,
    orderBy: { createdAt: 'desc' },
    take: 40
  }),
  ['sale-products-page'],
  { tags: ['products'], revalidate: 3600 }
);

// ==========================================
// 6. BRAND SUMMARIES CACHE
// ==========================================
export const getCachedCatalogBrandSummaries = unstable_cache(
  async () => {
    const rows = await prisma.brand.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        _count: {
          select: {
            products: {
              where: { isDeleted: false },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return rows.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      logo: b.logo,
      productCount: b._count.products,
    }));
  },
  ['catalog-brands-summaries'],
  { tags: ['brands'], revalidate: 3600 }
);

// ==========================================
// 7. CATEGORIES TREE CACHE
// ==========================================
export const getCachedCategoriesTree = unstable_cache(
  async () => {
    const allCategories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Only keep categories that have at least 1 product
    const withProducts = allCategories.filter(c => c._count.products > 0);

    // Organize hierarchically: roots first, followed by their children
    const roots = withProducts.filter(c => !c.parentId);
    const children = withProducts.filter(c => c.parentId);

    const childrenByParent = new Map<string, typeof withProducts>();
    for (const child of children) {
      if (child.parentId) {
        if (!childrenByParent.has(child.parentId)) {
          childrenByParent.set(child.parentId, []);
        }
        childrenByParent.get(child.parentId)!.push(child);
      }
    }

    const result: Array<{ id: string; name: string; slug: string | null; parentId: string | null }> = [];

    function addChildren(parentId: string) {
      const directChildren = childrenByParent.get(parentId) || [];
      for (const ch of directChildren) {
        result.push({
          id: ch.id,
          name: ch.name,
          slug: ch.slug,
          parentId: ch.parentId
        });
        addChildren(ch.id);
      }
    }

    for (const root of roots) {
      result.push({
        id: root.id,
        name: root.name,
        slug: root.slug,
        parentId: null
      });
      addChildren(root.id);
    }

    // Include any remaining child category whose root had 0 direct products
    for (const ch of children) {
      if (!result.find(r => r.id === ch.id)) {
        result.push({
          id: ch.id,
          name: ch.name,
          slug: ch.slug,
          parentId: ch.parentId
        });
      }
    }

    return result;
  },
  ['header-categories-with-products'],
  { tags: ['categories', 'products'], revalidate: 3600 }
);

export const getCachedProductCounts = unstable_cache(
  async () => {
    const [newCount, hotCount, saleCount] = await Promise.all([
      prisma.product.count({ where: { isDeleted: false } }),
      prisma.product.count({ where: { isDeleted: false, orderItems: { some: {} } } }),
      prisma.product.count({ where: { isDeleted: false, compareAtPrice: { not: null } } })
    ]);
    return { newCount, hotCount, saleCount };
  },
  ['layout-product-counts'],
  { tags: ['products'], revalidate: 3600 }
);

// ==========================================
// 8. SHOP FILTER METADATA CACHE
// ==========================================
export const getCachedShopFilterMetadata = unstable_cache(
  async () => {
    const [allCategories, allBrands, priceAgg] = await Promise.all([
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          parentId: true,
          _count: {
            select: { products: { where: { isDeleted: false } } }
          }
        },
        orderBy: { name: 'asc' }
      }),
      prisma.brand.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          _count: {
            select: { products: { where: { isDeleted: false } } }
          }
        },
        orderBy: { name: 'asc' }
      }),
      prisma.product.aggregate({
        where: { isDeleted: false },
        _min: { price: true },
        _max: { price: true }
      })
    ]);
    return {
      allCategories,
      allBrands,
      globalMinPrice: Math.floor(priceAgg._min?.price || 0),
      globalMaxPrice: Math.ceil(priceAgg._max?.price || 1000)
    };
  },
  ['shop-filter-metadata-v2'],
  { tags: ['categories', 'brands', 'products'], revalidate: 3600 }
);

// ==========================================
// 9. BLOG ARTICLES CACHE
// ==========================================
export const getCachedBlogArticles = unstable_cache(
  async () => {
    const [articles, recentArticles] = await Promise.all([
      prisma.article.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          title: true,
          slug: true,
          image: true,
          category: true,
          createdAt: true,
          excerpt: true,
          _count: { select: { comments: { where: { isApproved: true } } } }
        }
      }),
      prisma.article.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, slug: true }
      })
    ]);
    return { articles, recentArticles };
  },
  ['blog-articles-list'],
  { tags: ['articles'], revalidate: 3600 }
);

// ==========================================
// 10. SHIPPING ZONES CACHE
// ==========================================
export const getCachedShippingZones = unstable_cache(
  async () => {
    const rawZones = await prisma.shippingZone.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: { methods: { where: { isActive: true }, orderBy: { createdAt: 'asc' } } }
    });
    return rawZones;
  },
  ['active-shipping-zones'],
  { tags: ['shipping'], revalidate: 3600 }
);
