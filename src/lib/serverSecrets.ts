import crypto from 'crypto';

/**
 * Derive a dedicated HMAC key for newsletter double opt-in tokens.
 * SECURITY (M5): Never falls back to a public literal in production,
 * and derives a domain-separated subkey rather than signing directly with raw DB/service keys.
 */
export function getNewsletterHmacSecret(): string {
  if (process.env.NEWSLETTER_SECRET && process.env.NEWSLETTER_SECRET.length >= 16) {
    return process.env.NEWSLETTER_SECRET;
  }

  const masterKey =
    process.env.NEXTAUTH_SECRET ||
    process.env.CRON_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (masterKey) {
    return crypto
      .createHmac('sha256', masterKey)
      .update('hlg-newsletter-optin-hmac-v1')
      .digest('hex');
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEWSLETTER_SECRET is not configured in production environment.');
  }

  // Local development only
  return crypto
    .createHash('sha256')
    .update('dev-only-newsletter-secret-' + (process.cwd() || 'local'))
    .digest('hex');
}

/**
 * Constant-time string comparison to prevent timing side-channel attacks on secrets/tokens.
 */
export function timingSafeStringEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    // Perform dummy comparison to keep timing uniform
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}
