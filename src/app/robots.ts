import { MetadataRoute } from 'next';
import { getCachedSettings } from '@/lib/cache';
import { SITE_URL } from '@/lib/site';

export const revalidate = 86400; // Cache robots.txt for 24h

const DEFAULT_DISALLOW_PATHS = [
  '/admin/', 
  '/account/', 
  '/checkout/', 
  '/cart', 
  '/cart/', 
  '/search', 
  '/search/', 
  '/api/', 
  '/order-tracking', 
  '/order-tracking/', 
  '/compare', 
  '/compare/', 
  '/wishlist', 
  '/wishlist/', 
  '/login', 
  '/login/', 
  '/thank-you', 
  '/danke', 
  '/categorie-produit/', 
  '/produit/',
  // Anti-CPU: Disallow crawlers from executing infinite query permutations
  '/*?sort=',
  '/*?page=',
  '/*?filter=',
  '/*?q=',
  '/*?min_price=',
  '/*?max_price=',
  '/*?category=',
  '/*?brand=',
  '/*?rating=',
  '/*?view=',
  '/*?filter_cat=',
  '/*?column=',
  '/*?per_page=',
  '/*?rating_filter=',
  '/*?stock_status=',
  '/*?featured=',
  '/*?best_seller=',
  '/*?add-to-cart='
];

const AGGRESSIVE_SCRAPER_BOTS = [
  'AhrefsBot',
  'SemrushBot',
  'MJ12bot',
  'DotBot',
  'PetalBot',
  'Bytespider',
  'DataForSeoBot',
  'Amazonbot',
  'BLEXBot'
];

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = SITE_URL;

  // Read robots settings from cached settings (Zero DB hit)
  const settingsMap = await getCachedSettings();

  // Parse disallow paths from DB or use defaults
  let disallowPaths: string[] = DEFAULT_DISALLOW_PATHS;
  if (settingsMap['ROBOTS_DISALLOW_PATHS']) {
    try {
      const parsed = JSON.parse(settingsMap['ROBOTS_DISALLOW_PATHS']);
      if (Array.isArray(parsed) && parsed.length > 0) {
        disallowPaths = Array.from(new Set([...DEFAULT_DISALLOW_PATHS, ...parsed]));
      }
    } catch {
      disallowPaths = DEFAULT_DISALLOW_PATHS;
    }
  }

  // Parse crawl delay (optional)
  const crawlDelay = settingsMap['ROBOTS_CRAWL_DELAY']
    ? parseInt(settingsMap['ROBOTS_CRAWL_DELAY'], 10)
    : 1;

  return {
    rules: [
      // 1. Completely disallow aggressive SEO and third-party scrapers (Anti-Fluid CPU)
      {
        userAgent: AGGRESSIVE_SCRAPER_BOTS,
        disallow: ['/'],
      },
      // 2. Allow legitimate search engine bots (Google, Bing, DuckDuckGo) with strict query-string protection
      {
        userAgent: '*',
        allow: '/',
        disallow: disallowPaths,
        ...(crawlDelay && !isNaN(crawlDelay) ? { crawlDelay } : {}),
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
