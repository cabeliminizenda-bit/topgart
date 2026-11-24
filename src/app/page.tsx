/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import ReactDOM from 'react-dom';
import HlgHero from '@/components/home/HlgHero';
import GardenDealsShowcase from '@/components/home/GardenDealsShowcase';
import GardenCategoryShowcase from '@/components/home/GardenCategoryShowcase';
import CategoryShowcaseSections from '@/components/home/CategoryShowcaseSections';
import CategoryShowcaseSection from '@/components/home/CategoryShowcaseSection';
import CategoryOverviewSection from '@/components/home/CategoryOverviewSection';
import BrandShowcase from '@/components/home/BrandShowcase';
import ThermalHero from '@/components/home/ThermalHero';
import Newsletter from '@/components/home/Newsletter';
import PromoBanners from '@/components/home/PromoBanners';
import FullWidthBanner from '@/components/home/FullWidthBanner';
import TrustBar from '@/components/home/TrustBar';
import CategoryExplorer from '@/components/home/CategoryExplorer';
import ShippingSimulator from '@/components/home/ShippingSimulator';
import FeaturedProductTabs from '@/components/home/FeaturedProductTabs';
import HeatingGuideBlogs from '@/components/home/HeatingGuideBlogs';
import {
  getCachedSettings,
  getCachedCategoriesTree,
  getCachedHomepageProducts,
  getCachedCatalogBrandSummaries,
} from '@/lib/cache';
import { getOptimizedImageUrl } from '@/lib/images';
import {
  CatalogBrandSummary,
  DEFAULT_HLG_SECTIONS,
  SectionConfig,
  normalizeHomepageSections,
} from '@/components/home/categorySectionData';

export const revalidate = 3600;

export default async function Home() {
  // Hoist instant LCP Preloads directly into HTML <head> via React 19 API (0ms Resource Load Delay)
  ReactDOM.preload('/images/hero-garden-mower-mobile.avif', {
    as: 'image',
    media: '(max-width: 768px)',
    fetchPriority: 'high',
    type: 'image/avif',
  });
  ReactDOM.preload('/images/hero-garden-mower.avif', {
    as: 'image',
    media: '(min-width: 769px)',
    fetchPriority: 'high',
    type: 'image/avif',
  });

  const [settings, categories, homepageData, catalogBrands] = await Promise.all([
    getCachedSettings(),
    getCachedCategoriesTree(),
    getCachedHomepageProducts(),
    getCachedCatalogBrandSummaries(),
  ]);

  const formattedProducts = homepageData.formattedProducts;
  const dbBestsellers = homepageData.dbBestsellers;

  let layout: SectionConfig[] = [];
  try {
    if (settings.HOMEPAGE_LAYOUT) {
      layout = normalizeHomepageSections(JSON.parse(settings.HOMEPAGE_LAYOUT));
    } else {
      layout = DEFAULT_HLG_SECTIONS;
    }
  } catch (e) {
    console.error('Failed to parse HOMEPAGE_LAYOUT', e);
    layout = DEFAULT_HLG_SECTIONS;
  }

  // Extract best selling products for Hero Showcase Card rotation
  const heroShowcaseProducts = formattedProducts
    .filter(p => p.images && p.images.length > 0)
    .slice(0, 8)
    .map(p => {
      const savings = p.compareAtPrice && p.compareAtPrice > p.price ? p.compareAtPrice - p.price : 0;
      const discountPct = p.compareAtPrice && p.compareAtPrice > p.price
        ? Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100)
        : null;
      return {
        id: p.id,
        title: p.title,
        subtitle: p.categoryName ? `${p.categoryName} • Geprüfte Top-Qualität` : 'Geprüfte Top Gartengeräte Qualität',
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        image: p.images[0],
        badge: discountPct ? `SPAREN -${discountPct}%` : 'BESTSELLER',
        badgeTech: p.categoryName ? `✨ ${p.categoryName}` : '✨ Top Qualität',
        badgeTech2: savings > 0 ? `Sie sparen ${savings.toFixed(2).replace('.', ',')} €` : 'Sofort lieferbar',
        categoryName: p.categoryName || ''
      };
    });

  // Filter only enabled sections
  const activeSections = layout.filter(s => s.enabled);

  // Extract LCP Hero image for instant SSR preload tag (Lighthouse / PageSpeed optimization)
  const heroSection = activeSections.find(s => s.type === 'Hero');
  const heroConfig = heroSection?.settings;
  const rawHeroImage =
    heroConfig?.bannerImage && heroConfig.bannerImage !== '/images/hero-appliances.jpg'
      ? heroConfig.bannerImage
      : heroConfig?.bgImageUrl && heroConfig.bgImageUrl !== '/images/hero-appliances.jpg'
        ? heroConfig.bgImageUrl
        : '/images/hero-garden-mower.jpg';

  const lcpHeroImage = rawHeroImage.startsWith('/images/')
    ? rawHeroImage
    : getOptimizedImageUrl(rawHeroImage, 1200);

  const renderSection = (section: SectionConfig) => {
    switch (section.type) {
      case 'Hero':
        return <HlgHero key={section.id} config={section.settings} categories={categories} />;
      case 'AktuelleAngebote':
      case 'BestDeals':
        return (
          <GardenDealsShowcase
            key={section.id}
            catalogProducts={formattedProducts}
            config={section.settings}
          />
        );
      case 'GardenCategoryShowcase':
        return (
          <GardenCategoryShowcase
            key={section.id}
            catalogProducts={formattedProducts}
            config={section.settings}
          />
        );
      case 'CategoryShowcaseSection':
        return (
          <CategoryShowcaseSection
            key={section.id}
            config={section.settings}
            catalogProducts={formattedProducts}
          />
        );
      case 'CategoryOverview':
        return (
          <CategoryOverviewSection
            key={section.id}
            config={section.settings}
            catalogProducts={formattedProducts}
          />
        );
      case 'CategoryShowcase':
        return <CategoryShowcaseSections key={section.id} catalogProducts={formattedProducts} />;
      case 'BrandShowcase':
        return (
          <BrandShowcase
            key={section.id}
            config={section.settings}
            catalogBrands={catalogBrands}
          />
        );
      case 'TrustBar':
        return <TrustBar key={section.id} />;
      case 'CategoryExplorer':
        return <CategoryExplorer key={section.id} />;
      case 'HeatingGuideBlogs':
      case 'LatestBlogs':
        return <HeatingGuideBlogs key={section.id} />;
      case 'Newsletter':
        return <Newsletter key={section.id} config={section.settings} />;
      case 'PromoBanners':
        return <PromoBanners key={section.id} config={section.settings} />;
      case 'FullWidthBanner':
        return <FullWidthBanner key={section.id} config={section.settings} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <main>
        {activeSections.map(renderSection)}
      </main>
    </div>
  );
}
