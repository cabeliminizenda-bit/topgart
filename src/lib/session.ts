import crypto from 'crypto';

export const ADMIN_SESSION_COOKIE = 'admin_session';

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const hashedBuf = Buffer.from(hash, 'hex');
    const suppliedBuf = crypto.scryptSync(password, salt, 64);
    if (hashedBuf.length !== suppliedBuf.length) return false;
    return crypto.timingSafeEqual(hashedBuf, suppliedBuf);
  } catch {
    return false;
  }
}

export function createAdminSessionToken(user: { id: string; email: string; role: string }): string {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    exp: Date.now() + 14 * 24 * 60 * 60 * 1000, // 14 days
  };
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'topgart-standalone-admin-secret-key-2026';
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${signature}`;
}

export function verifyAdminSessionToken(token?: string | null): { userId: string; email: string; role: string } | null {
  if (!token) return null;
  try {
    const [data, signature] = token.split('.');
    if (!data || !signature) return null;
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'topgart-standalone-admin-secret-key-2026';
    const expectedSig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (!payload || !payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
