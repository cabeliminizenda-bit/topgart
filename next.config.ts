import type { NextConfig } from "next";

const withNextIntl = require('next-intl/plugin')('./src/i18n/request.ts');

const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  compress: true,
  serverExternalPackages: ['pdfkit', 'fontkit', '@swc/helpers'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    optimizePackageImports: ['react-hot-toast', 'zustand'],
    inlineCss: true,
  },
  turbopack: {},

  images: {
    loader: 'custom',
    loaderFile: './src/lib/cloudinaryLoader.ts',
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [384, 640, 1080, 1600],
    imageSizes: [64, 128, 256],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: supabaseHost || '**.supabase.co',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/produkt-kategorie/:path*',
        destination: '/product-category/:path*',
        permanent: true,
      },
      {
        source: '/kategorie/:path*',
        destination: '/product-category/:path*',
        permanent: true,
      },
      {
        source: '/category/:path*',
        destination: '/product-category/:path*',
        permanent: true,
      },
      {
        source: '/categorie-produit/:path*',
        destination: '/product-category/:path*',
        permanent: true,
      },
      {
        source: '/categoria-produto/:path*',
        destination: '/product-category/:path*',
        permanent: true,
      },
      {
        source: '/etiquette-produit/:path*',
        destination: '/shop',
        permanent: true,
      },
      {
        source: '/product/:path*',
        destination: '/produkt/:path*',
        permanent: true,
      },
      {
        source: '/produit/:path*',
        destination: '/produkt/:path*',
        permanent: true,
      },
      {
        source: '/produto/:path*',
        destination: '/produkt/:path*',
        permanent: true,
      },
      {
        source: '/team/:path*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/pricing-table',
        destination: '/',
        permanent: true,
      },
      {
        source: '/blogs',
        destination: '/blog',
        permanent: true,
      },

      {
        source: '/wp-content/:path*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/wp-json/:path*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/wp-includes/:path*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/wp-admin/:path*',
        destination: '/',
        permanent: true,
      }
    ];
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com https://www.paypal.com https://us.i.posthog.com https://us-assets.i.posthog.com https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://res.cloudinary.com https://*.cloudinary.com https://images.unsplash.com https://*.supabase.co https://*.stripe.com https://www.google-analytics.com https://www.googletagmanager.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co https://api.stripe.com https://api-m.paypal.com https://us.i.posthog.com https://us-assets.i.posthog.com https://www.google-analytics.com https://www.googletagmanager.com; frame-src 'self' https://js.stripe.com https://www.paypal.com https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.google.com https://maps.google.com; object-src 'none'; base-uri 'self'; form-action 'self' https://www.paypal.com https://*.stripe.com; frame-ancestors 'self'; upgrade-insecure-requests;",
          },
        ],
      },
      {
        // Prevent leaking order IDs or tracking tokens in Referer headers (L1 hardening)
        source: '/checkout/success',
        headers: [
          {
            key: 'Referrer-Policy',
            value: 'no-referrer',
          },
        ],
      },
      {
        source: '/order-tracking',
        headers: [
          {
            key: 'Referrer-Policy',
            value: 'no-referrer',
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
