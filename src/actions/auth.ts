'use server';

import { createClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { timingSafeStringEqual } from '@/lib/serverSecrets';

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
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: 'global' });
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function setupAdmin(formData: FormData) {
  const ip = await getClientIp();
  const rl = await checkRateLimit(`setup_admin_${ip}`, 3, 3600); // 3 attempts per hour
  if (!rl.success) {
    return { error: 'Trop de tentatives de configuration. Accès restreint.' };
  }

  // SECURITY (M6): Require SETUP_TOKEN in production (or whenever configured) to prevent public takeover
  const requiredSetupToken = process.env.SETUP_TOKEN;
  const providedSetupToken = String(formData.get('setupToken') || '').trim();
  if (process.env.NODE_ENV === 'production' && !requiredSetupToken) {
    return { error: 'L\'initialisation administrateur est désactivée (SETUP_TOKEN manquant).' };
  }
  if (requiredSetupToken && !timingSafeStringEqual(providedSetupToken, requiredSetupToken)) {
    return { error: 'Jeton de configuration invalide.' };
  }

  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  if (!email || !password) {
    return { error: 'Tous les champs sont requis.' };
  }

  if (password.length < 12) {
    return { error: 'Le mot de passe administrateur doit comporter au moins 12 caractères.' };
  }

  // Atomically check that there is no existing admin
  const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
  if (adminCount > 0) {
    return { error: 'Un administrateur existe déjà. L\'initialisation est verrouillée.' };
  }

  // Never silently promote an existing customer account
  const existingCustomer = await prisma.user.findUnique({ where: { email } });
  if (existingCustomer) {
    return { error: 'Cette adresse e-mail est déjà utilisée par un autre compte.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username: 'Admin' }
    }
  });

  if (error) {
    console.error('[setupAdmin] Supabase error:', error.message);
    return { error: 'Erreur lors de la création du compte administrateur.' };
  }

  if (data.user) {
    // Re-verify no other admin was created concurrently
    const recheckCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (recheckCount > 0) {
      return { error: 'Un administrateur a déjà été configuré.' };
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
  return { success: true };
}

export async function loginAdmin(formData: FormData) {
  const ip = await getClientIp();
  const rl = await checkRateLimit(`login_admin_${ip}`, 5, 900); // 5 attempts per 15 mins
  if (!rl.success) {
    return { error: 'Trop de tentatives de connexion administrateur. Accès temporairement suspendu.' };
  }

  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  if (!email || !password) {
    return { error: 'L\'email et le mot de passe sont requis.' };
  }

  // SECURITY (H4): Also rate-limit per admin email across IPs
  const emailRl = await checkRateLimit(`login_admin_email_${email}`, 5, 900);
  if (!emailRl.success) {
    return { error: 'Trop de tentatives de connexion administrateur. Accès temporairement suspendu.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: 'Identifiants incorrects.' };
  }

  if (data.user) {
    const user = await prisma.user.findUnique({ where: { id: data.user.id } });
    if (!user || user.role !== 'ADMIN') {
      await supabase.auth.signOut({ scope: 'global' });
      return { error: 'Accès refusé. Vous n’êtes pas administrateur.' };
    }
  }

  revalidatePath('/admin', 'layout');
  return { success: true };
}

export async function getUserRole() {
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
