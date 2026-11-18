'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
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
  const currentPassword = String(formData.get('currentPassword') || '');
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

  const isChangingEmail = Boolean(email && email !== user.email);
  const isChangingPassword = Boolean(newPassword || confirmPassword);

  // SECURITY (L7): Require current password verification for sensitive credential changes
  if ((isChangingEmail || isChangingPassword) && user.email) {
    if (!currentPassword) {
      return { error: 'Bitte geben Sie Ihr aktuelles Passwort ein, um E-Mail oder Passwort zu ändern.' };
    }
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (verifyError) {
      return { error: 'Das aktuelle Passwort ist nicht korrekt.' };
    }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (isChangingEmail) {
    if (!emailRegex.test(email) || email.length > 254) {
      return { error: 'Ungültige E-Mail-Adresse.' };
    }
    updates.email = email;
  }

  if (isChangingPassword) {
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

  // SECURITY (L7): Do NOT overwrite prisma.user.email before Supabase confirms the email change.
  // Prisma user lookup uses user.id, and email stays synchronized after confirmation.

  revalidatePath('/account/details');
  return {
    success: true,
    message: isChangingEmail
      ? 'Kontodaten aktualisiert. Bitte bestätigen Sie Ihre neue E-Mail-Adresse über den Bestätigungslink.'
      : 'Kontodaten wurden erfolgreich aktualisiert.'
  };
}
