'use server';

import { createClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { headers, cookies } from 'next/headers';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { timingSafeStringEqual } from '@/lib/serverSecrets';
import { SITE_URL } from '@/lib/site';
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  verifyAdminSessionToken,
  verifyPassword,
} from '@/lib/session';

export async function loginUser(formData: FormData) {
  const ip = await getClientIp();
  const rl = await checkRateLimit(`login_${ip}`, 5, 300); // 5 attempts per 5 mins
  if (!rl.success) {
    return { error: 'Zu viele Anmeldeversuche. Bitte warten Sie 5 Minuten.' };
  }

  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  if (!email || !password) {
    return { error: 'E-Mail und Passwort sind erforderlich.' };
  }

  // SECURITY (H4): Also rate-limit per email to block distributed brute-force across IPs
  const emailRl = await checkRateLimit(`login_email_${email}`, 5, 300);
  if (!emailRl.success) {
    return { error: 'Zu viele Anmeldeversuche. Bitte warten Sie 5 Minuten.' };
  }

  const supabase = await createClient();

  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !signInData.user) {
    return { error: 'Ungültige Anmeldedaten.' };
  }

  // SECURITY (H3): Only link prior guest orders if the user's email has been verified by Supabase Auth.
  const isEmailConfirmed = Boolean(signInData.user.email_confirmed_at);
  try {
    const existingById = await prisma.user.findUnique({
      where: { id: signInData.user.id }
    });
    const existingByEmail = await prisma.user.findUnique({
      where: { email: signInData.user.email || email }
    });

    if (!existingById && !existingByEmail) {
      await prisma.user.create({
        data: {
          id: signInData.user.id,
          email: signInData.user.email || email,
          role: 'CUSTOMER'
        }
      });
    } else if (
      isEmailConfirmed &&
      existingByEmail &&
      existingByEmail.id !== signInData.user.id &&
      existingByEmail.role !== 'ADMIN' &&
      !existingById
    ) {
      // Safe transaction after verified email & credentials: link guest orders to registered account
      await prisma.$transaction([
        prisma.order.updateMany({ where: { userId: existingByEmail.id }, data: { userId: signInData.user.id } }),
        prisma.review.updateMany({ where: { userId: existingByEmail.id }, data: { userId: signInData.user.id } }),
        prisma.notification.updateMany({ where: { userId: existingByEmail.id }, data: { userId: signInData.user.id } }),
        prisma.user.delete({ where: { id: existingByEmail.id } }),
        prisma.user.create({
          data: {
            id: signInData.user.id,
            email: signInData.user.email || email,
            role: 'CUSTOMER'
          }
        })
      ]);
    }
  } catch (e) {
    console.error("[Login] Error syncing guest orders on verified login:", e);
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function registerUser(formData: FormData) {
  const ip = await getClientIp();
  const rl = await checkRateLimit(`register_${ip}`, 5, 1800); // 5 registrations per 30 mins
  if (!rl.success) {
    return { error: 'Zu viele Registrierungsversuche. Bitte versuchen Sie es später erneut.' };
  }

  const username = String(formData.get('username') || '').trim();
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  if (!email || !password || !username) {
    return { error: 'Alle Felder sind erforderlich.' };
  }

  if (password.length < 8) {
    return { error: 'Das Passwort muss mindestens 8 Zeichen lang sein.' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username,
      }
    }
  });

  if (error) {
    console.warn('[Register] Supabase signup error:', error.message);
    // Generic sanitized error to avoid account enumeration
    if (error.message.toLowerCase().includes('already registered')) {
      return { error: 'Ein Konto mit dieser E-Mail-Adresse existiert bereits oder die Daten sind ungültig.' };
    }
    return { error: 'Fehler bei der Registrierung. Bitte überprüfen Sie Ihre Eingaben.' };
  }

  if (data.user) {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.user.email || email }
      });

      if (!existingUser) {
        await prisma.user.create({
          data: {
            id: data.user.id,
            email: data.user.email || email,
            role: 'CUSTOMER'
          }
        });
      } else {
        // Un compte existe déjà. Ne JAMAIS supprimer ni écraser lors de l'inscription
        // pour empêcher tout déni de service admin ou vol de commandes invitées.
        // La liaison sécurisée s'effectue au login vérifié.
        console.warn(`[Register] User already exists in DB for ${email}. Deferring linking to verified login.`);
      }
    } catch (e) {
      console.error("Error syncing Prisma user on signup:", e);
    }
  }

  revalidatePath('/', 'layout');

  if (!data.session) {
    return { success: true, message: "Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mails, um Ihr Konto vor der Anmeldung zu bestätigen." };
  }

  return { success: true };
}

export async function logoutUser() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(ADMIN_SESSION_COOKIE);
  } catch {}
  try {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: 'global' });
  } catch {}
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function setupAdmin(formData: FormData) {
  const ip = await getClientIp();
  const rl = await checkRateLimit(`setup_admin_${ip}`, 3, 3600); // 3 attempts per hour
  if (!rl.success) {
    return { error: 'Zu viele Einrichtungsversuche. Zugriff eingeschränkt.' };
  }

  // Optional setup token protection whenever SETUP_TOKEN is configured in env
  const requiredSetupToken = process.env.SETUP_TOKEN;
  const providedSetupToken = String(formData.get('setupToken') || '').trim();
  if (requiredSetupToken && !timingSafeStringEqual(providedSetupToken, requiredSetupToken)) {
    return { error: 'Ungültiges Einrichtungs-Token.' };
  }

  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  if (!email || !password) {
    return { error: 'Alle Felder sind erforderlich.' };
  }

  if (password.length < 8) {
    return { error: 'Das Administrator-Passwort muss mindestens 8 Zeichen lang sein.' };
  }

  // Atomically check that there is no existing admin
  const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
  if (adminCount > 0) {
    return { error: 'Es existiert bereits ein Administrator. Die Einrichtung ist gesperrt.' };
  }

  // Never silently promote an existing customer account
  const existingCustomer = await prisma.user.findUnique({ where: { email } });
  if (existingCustomer) {
    return { error: 'Diese E-Mail-Adresse wird bereits von einem anderen Konto verwendet.' };
  }

  // Resolve origin for email confirmation redirect (works both locally and in production)
  let redirectBase = SITE_URL;
  try {
    const hdrs = await headers();
    const origin = hdrs.get('origin');
    const host = hdrs.get('x-forwarded-host') || hdrs.get('host');
    const proto = hdrs.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https');
    if (origin && /^https?:\/\//i.test(origin)) {
      redirectBase = origin.replace(/\/$/, '');
    } else if (host) {
      redirectBase = `${proto}://${host}`;
    }
  } catch {}

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${redirectBase}/admin/login`,
      data: { username: 'Admin' }
    }
  });

  if (error) {
    console.error('[setupAdmin] Supabase error:', error.message);
    return { error: 'Fehler beim Erstellen des Administratorkontos. Bitte überprüfen Sie Ihre Eingaben.' };
  }

  if (data.user) {
    // Re-verify no other admin was created concurrently
    const recheckCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (recheckCount > 0) {
      return { error: 'Ein Administrator wurde bereits eingerichtet.' };
    }

    await prisma.user.create({
      data: {
        id: data.user.id,
        email: data.user.email || email,
        role: 'ADMIN',
      }
    });
  }

  revalidatePath('/', 'layout');

  if (!data.session) {
    return {
      success: true,
      needsConfirmation: true,
      message: 'Administratorkonto erstellt! Ein Bestätigungslink wurde an Ihre E-Mail-Adresse gesendet. Bitte bestätigen Sie Ihre E-Mail über den Link und melden Sie sich anschließend an.',
    };
  }

  return { success: true };
}

export async function loginAdmin(formData: FormData) {
  const ip = await getClientIp();
  const rl = await checkRateLimit(`login_admin_${ip}`, 10, 900); // 10 attempts per 15 mins
  if (!rl.success) {
    return { error: 'Zu viele Anmeldeversuche. Zugriff vorübergehend gesperrt.' };
  }

  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  if (!email || !password) {
    return { error: 'E-Mail und Passwort sind erforderlich.' };
  }

  // SECURITY (H4): Also rate-limit per admin email across IPs
  const emailRl = await checkRateLimit(`login_admin_email_${email}`, 10, 900);
  if (!emailRl.success) {
    return { error: 'Zu viele Anmeldeversuche. Zugriff vorübergehend gesperrt.' };
  }

  // 1. Standalone Neon Admin Authentication (Zero Supabase Dependency)
  const dbUser = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' }, role: 'ADMIN' },
  });

  if (dbUser) {
    const [hashSetting, saltSetting] = await Promise.all([
      prisma.setting.findUnique({ where: { key: 'ADMIN_PASSWORD_HASH' } }),
      prisma.setting.findUnique({ where: { key: 'ADMIN_PASSWORD_SALT' } }),
    ]);

    if (hashSetting?.value && saltSetting?.value) {
      const isValid = verifyPassword(password, hashSetting.value, saltSetting.value);
      if (isValid) {
        const token = createAdminSessionToken({
          id: dbUser.id,
          email: dbUser.email,
          role: dbUser.role,
        });

        const cookieStore = await cookies();
        cookieStore.set(ADMIN_SESSION_COOKIE, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 14 * 24 * 60 * 60, // 14 days
          path: '/',
        });

        revalidatePath('/admin', 'layout');
        return { success: true };
      }
    }
  }

  // 2. Fallback to Supabase Auth if standalone hash not configured
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.user) {
      const user = await prisma.user.findUnique({ where: { id: data.user.id } });
      if (user && user.role === 'ADMIN') {
        revalidatePath('/admin', 'layout');
        return { success: true };
      }
    }
  } catch (supabaseErr) {
    console.warn('[loginAdmin] Supabase Auth unavailable (fallback passed):', supabaseErr);
  }

  return { error: 'Ungültige Zugangsdaten.' };
}

export async function getUserRole() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    const session = verifyAdminSessionToken(token);
    if (session?.userId) {
      const dbUser = await prisma.user.findUnique({ where: { id: session.userId } });
      if (dbUser) return dbUser.role;
    }
  } catch {}

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      if (dbUser) return dbUser.role;
    }
  } catch (e) {
    console.error("Error fetching user role", e);
  }
  return null;
}
