import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Initialize Redis and Ratelimit if env vars are present (supports both Upstash & Vercel KV prefixes)
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

let ratelimit: Ratelimit | null = null;
if (redisUrl && redisToken) {
  ratelimit = new Ratelimit({
    redis: new Redis({ url: redisUrl, token: redisToken }),
    limiter: Ratelimit.slidingWindow(30, '10 s'), // 30 max requests per 10 seconds per IP
    analytics: true,
  });
}

export async function middleware(request: NextRequest) {
  const isPrefetch = request.headers.get('purpose') === 'prefetch' || request.headers.get('x-middleware-prefetch') === '1';
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');

  // 1. Rate Limiting Check (Protection anti-DDoS / Brute force sur routes publiques)
  if (ratelimit && !isAdminRoute && !isPrefetch) {
    // Prefer trusted Vercel/proxy headers before generic x-forwarded-for
    const vercelForwarded = request.headers.get('x-vercel-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip =
      (vercelForwarded ? vercelForwarded.split(',')[0].trim() : '') ||
      (realIp ? realIp.trim() : '') ||
      (forwardedFor ? forwardedFor.split(',')[0].trim() : '') ||
      (request as NextRequest & { ip?: string }).ip ||
      '127.0.0.1';

    // Check limit for this IP
    const { success, limit, reset, remaining } = await ratelimit.limit(`ratelimit_${ip}`);

    if (!success) {
      const isRSC = request.headers.get('rsc') === '1' || request.nextUrl.searchParams.has('_rsc');
      if (isRSC || request.headers.get('accept')?.includes('application/json')) {
        return NextResponse.json(
          { error: 'Zu viele Anfragen', retryAfter: Math.ceil((reset - Date.now()) / 1000) },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': reset.toString(),
              'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
            }
          }
        );
      }

      return new NextResponse(
        `<!DOCTYPE html><html lang="de"><head><title>429 Zu viele Anfragen</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="font-family: system-ui; text-align: center; padding: 2rem; background: #f9fafb;"><h1 style="color: #ef4444;">Zugriff vorübergehend gesperrt</h1><p>Sie haben in kurzer Zeit zu viele Anfragen gesendet.</p><p>Aus Sicherheitsgründen warten Sie bitte einige Sekunden, bevor Sie es erneut versuchen.</p></body></html>`,
        {
          status: 429,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          }
        }
      );
    }
  }

  // 2. Update Supabase session
  const response = await updateSession(request)

  // Custom route protection logic
  // For example, redirect unauthenticated users away from /account
  const url = request.nextUrl.clone()
  const hasSession = request.cookies.getAll().some(
    c => c.name.startsWith('sb-') && (c.name.endsWith('-auth-token') || c.name.includes('-auth-token.'))
  )

  if (url.pathname.startsWith('/account')) {
    if (!hasSession) {
      url.pathname = '/login'
      return Response.redirect(url)
    }
  }

  // SECURITY (H2 / L2): Edge session guard on /admin/* (except login & setup) and /preview
  if (
    (url.pathname.startsWith('/admin') &&
      url.pathname !== '/admin/login' &&
      url.pathname !== '/admin/setup') ||
    url.pathname === '/preview' ||
    url.pathname.startsWith('/preview/')
  ) {
    if (!hasSession) {
      url.pathname = '/admin/login'
      return Response.redirect(url)
    }
  }

  // Set x-pathname to be used by i18n
  response.headers.set('x-pathname', url.pathname)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff|woff2|ttf|eot)$).*)',
  ],
}
