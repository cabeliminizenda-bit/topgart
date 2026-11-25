// Server-only authorization helpers (internal, not client-callable server actions)

import { createClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/session';

/**
 * Vérifie que l'utilisateur courant est authentifié et a le rôle ADMIN.
 * Lance une erreur si non autorisé — à utiliser dans toutes les server actions admin.
 * Supporte le mode session autonome Neon en priorité absolue.
 * 
 * @returns L'utilisateur Prisma vérifié
 * @throws Error si non authentifié ou non admin
 */
export async function requireAdmin() {
  // 1. Standalone Neon Admin Session (Zero Supabase dependency)
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    const session = verifyAdminSessionToken(token);
    if (session && session.userId) {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
      });
      if (user && user.role === 'ADMIN') {
        return user;
      }
    }
  } catch (e) {
    console.warn('[requireAdmin] Standalone session check failed, falling back to Supabase:', e);
  }

  // 2. Fallback to Supabase Auth
  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error } = await supabase.auth.getUser();

    if (!error && authUser) {
      const user = await prisma.user.findUnique({
        where: { id: authUser.id },
      });

      if (user && user.role === 'ADMIN') {
        return user;
      }
    }
  } catch (e) {
    console.error('[requireAdmin] Supabase Auth error (quota/network):', e);
  }

  throw new Error('Forbidden: Admin access required.');
}

/**
 * Vérifie que l'utilisateur courant est authentifié (n'importe quel rôle).
 * 
 * @returns L'utilisateur Prisma vérifié
 * @throws Error si non authentifié
 */
export async function requireAuth() {
  // 1. Standalone session check
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    const session = verifyAdminSessionToken(token);
    if (session && session.userId) {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
      });
      if (user) {
        return user;
      }
    }
  } catch (e) {
    console.warn('[requireAuth] Standalone session check failed:', e);
  }

  // 2. Fallback to Supabase Auth
  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error } = await supabase.auth.getUser();

    if (!error && authUser) {
      const user = await prisma.user.findUnique({
        where: { id: authUser.id },
      });

      if (user) {
        return user;
      }
    }
  } catch (e) {
    console.error('[requireAuth] Supabase Auth error:', e);
  }

  throw new Error('Unauthorized: You must be logged in.');
}

/**
 * Page-level admin guard for Server Components (H2).
 * Unlike layouts, Next.js always executes the target page.tsx on navigation,
 * preventing RSC partial-rendering authorization bypasses.
 */
export async function requireAdminPage() {
  // 1. Standalone Neon Admin Session (Zero Supabase dependency)
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    const session = verifyAdminSessionToken(token);
    if (session && session.userId) {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
      });
      if (user && user.role === 'ADMIN') {
        return user;
      }
    }
  } catch (e) {
    console.warn('[requireAdminPage] Standalone check error:', e);
  }

  // 2. Fallback to Supabase Auth
  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error } = await supabase.auth.getUser();

    if (!error && authUser) {
      const user = await prisma.user.findUnique({
        where: { id: authUser.id },
      });

      if (user && user.role === 'ADMIN') {
        return user;
      }
    }
  } catch (e) {
    console.error('[requireAdminPage] Supabase error:', e);
  }

  redirect('/admin/login');
}
