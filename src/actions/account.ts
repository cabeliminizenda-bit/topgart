'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function updateAccountDetails(formData: FormData) {
  const ip = await getClientIp();
  const rl = await checkRateLimit(`account_update_${ip}`, 10, 600); // 10 updates per 10 min
  if (!rl.success) {
    return { error: 'Zu viele Anfragen. Bitte warten Sie einen Moment.' };
  }

  const firstName = String(formData.get('firstName') || '').trim().slice(0, 100);
  const lastName = String(formData.get('lastName') || '').trim().slice(0, 100);
  const displayName = String(formData.get('displayName') || '').trim().slice(0, 100);
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const newPassword = String(formData.get('newPassword') || '');
  const confirmPassword = String(formData.get('confirmPassword') || '');

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: 'Sie müssen angemeldet sein.' };
  }

  const updates: { email?: string; password?: string; data: Record<string, string> } = {
    data: {
      firstName,
      lastName,
      displayName,
    }
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && email !== user.email) {
    if (!emailRegex.test(email) || email.length > 254) {
      return { error: 'Ungültige E-Mail-Adresse.' };
    }
    updates.email = email;
  }

  if (newPassword || confirmPassword) {
    if (newPassword !== confirmPassword) {
      return { error: 'Die neuen Passwörter stimmen nicht überein.' };
    }
    if (!newPassword || newPassword.length < 8) {
      return { error: 'Das Passwort muss mindestens 8 Zeichen lang sein.' };
    }
    updates.password = newPassword;
  }

  const { error: updateError } = await supabase.auth.updateUser(updates);

  if (updateError) {
    console.warn('[Account] Supabase updateUser error:', updateError.message);
    return { error: 'Fehler beim Aktualisieren des Kontos. Bitte überprüfen Sie Ihre Angaben.' };
  }

  // Sync Prisma user if email was changed
  if (email && email !== user.email) {
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { email }
      });
    } catch (e) {
      console.error('[Account] Error syncing email to Prisma:', e);
    }
  }

  revalidatePath('/account/details');
  return { success: true, message: 'Kontodaten wurden erfolgreich aktualisiert.' };
}
