import { notFound, permanentRedirect } from 'next/navigation';
import { getCategoryCanonicalPath, getCategoryByPathSegments, resolveCategoryFilter } from '@/lib/categories';

export default async function ProductCategoryCatchAllPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await params;
  const slugSegments = resolvedParams.slug || [];

  if (slugSegments.length === 0) {
    permanentRedirect('/shop');
  }

  // 1. Try matching hierarchical segments directly (e.g. ['kuechen', 'kaffeemaschinen'])
  let category = await getCategoryByPathSegments(slugSegments);

  // 2. If not matched, try resolving by the last segment (e.g. target category slug or UUID)
  if (!category) {
    const targetSlug = decodeURIComponent(slugSegments[slugSegments.length - 1]);
    const { category: resolvedCat } = await resolveCategoryFilter(targetSlug);
    category = resolvedCat;
  }

  if (!category) {
    notFound();
  }

  // Strip Category Base: Permanently 308/301 redirect /product-category/... to the clean canonical root path (e.g. /kaffeemaschinen)
  const canonicalPath = await getCategoryCanonicalPath(category);
  const resolvedSearchParams = await searchParams;
  const queryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach(v => queryParams.append(key, v));
      } else {
        queryParams.append(key, value);
      }
    }
  }

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  permanentRedirect(`${canonicalPath}${queryString}`);
}
