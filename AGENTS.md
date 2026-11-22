<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Core Architecture & Performance Guidelines

## 1. Database & Network Egress Protection (Strict Rules)
To prevent cloud database bandwidth exhaustion (Supabase / Neon / Postgres) and eliminate 402/quota crashes:

1. **Mandatory SQL-Level Pagination (`take` & `skip`)**:
   - NEVER execute `prisma.<model>.findMany()` without a `take` limit in page routes or public APIs.
   - NEVER load all records into Node.js memory to do in-memory `.slice(start, end)` or array filtering. All filtering, sorting, and pagination MUST occur directly inside the SQL query.
   - Always enforce reasonable pagination limits on catalog, shop, hot, sale, search, and blog routes (e.g., `take: 24` or `take: 48`).

2. **Strict Column & Field Projection (`select`)**:
   - In catalog, grid, carousels, and list views, NEVER query full entity records with `*`.
   - Always define and reuse lean projections (e.g., `productCardSelect`) that only include lightweight fields (`id`, `title`, `slug`, `price`, `compareAtPrice`, `images`, `stock`, `categories`).
   - NEVER pull heavy text columns (`description`, `longDescription`, raw markdown/HTML), large JSON payloads (`specifications`, `attributes`, `cartData`), or unrelated relations unless rendering the single detailed view (`[slug]/page.tsx`).

3. **Cache Repetitive Public Metadata**:
   - Wrap repeated semi-static queries (categories list, brand list, price ranges, site settings, navigation trees) in `unstable_cache` with a reasonable revalidation window (e.g., `revalidate: 300` to `3600` seconds).
   - Tag cached items with clear tags (e.g. `tags: ['categories', 'brands']`) and invalidate them selectively when updated in the admin panel (`revalidateTag`).

4. **Fast-Path Authentication & Middleware Optimization**:
   - In `middleware.ts`, strictly exclude static assets, images (`.avif`, `.webp`, `.png`, `.jpg`, `.svg`, `.ico`), and web fonts (`.woff`, `.woff2`, `.ttf`) from triggering Next.js or Supabase middleware.
   - In Supabase session middleware (`src/utils/supabase/middleware.ts`), implement a fast-path check: do NOT call `supabase.auth.getUser()` if no session cookie (`sb-*-auth-token`) exists. Anonymous visitors, bots, and crawlers must bypass Auth network calls entirely.

---

## 2. Core Web Vitals & LCP Optimization
1. **LCP Image Delivery**:
   - Deliver mobile and desktop banner hero images in modern formats (**AVIF** first, **WebP** fallback) via `<picture>` elements.
   - Keep mobile hero image weights strictly below **15 KiB** to pass Lighthouse recommendations.
   - Hoist high-priority LCP preloads at the root of the page (using React 19 `ReactDOM.preload`) to eliminate Resource Load Delay.
2. **Prioritization**:
   - Only the single true LCP hero banner should have `fetchpriority="high"` and `loading="eager"`.
   - Secondary images (logos, promotional grid banners, category circles) must NOT steal bandwidth with `priority` or `fetchpriority="high"`.

---

## 3. Internationalization & Localization
1. **Customer-Facing Language**:
   - All public storefront content, banners, product specifications, legal notices, checkout forms, and transactional emails must remain **100% German (`de-DE`)**.
2. **Developer & Assistant Communication**:
   - Direct communication with the user must be in **French (`fr-FR`)**.
