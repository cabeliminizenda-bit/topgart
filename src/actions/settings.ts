'use server';

import prisma from '@/lib/prisma';
import { revalidatePath, updateTag } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';
import { isSensitiveSettingKey } from '@/lib/security';

/**
 * Fetch settings map.
 *
 * SECURITY (M3): If called without an active ADMIN session, all sensitive
 * credentials, internal drafts, SMTP settings, and subscriber lists are stripped.
 */
export async function getSettings() {
  const settings = await prisma.setting.findMany();
  const settingsMap: Record<string, string> = {};

  let isAdmin = false;
  try {
    await requireAdmin();
    isAdmin = true;
  } catch {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (dbUser?.role === 'ADMIN') {
          isAdmin = true;
        }
      }
    } catch {
      isAdmin = false;
    }
  }

  settings.forEach(s => {
    if (isAdmin || !isSensitiveSettingKey(s.key)) {
      settingsMap[s.key] = s.value;
    }
  });

  return settingsMap;
}

export async function updateSetting(key: string, value: string) {
  await requireAdmin();
  try {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
    revalidatePath('/', 'layout');
    updateTag('settings');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateSettingsBatch(settingsMap: Record<string, string>) {
  await requireAdmin();
  try {
    const transactions = Object.entries(settingsMap).map(([key, value]) => {
      return prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      });
    });

    await prisma.$transaction(transactions);
    revalidatePath('/', 'layout');
    updateTag('settings');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function saveThankYouSettings(settingsMap: Record<string, string>) {
  await requireAdmin();
  try {
    const transactions = Object.entries(settingsMap).map(([key, value]) => {
      return prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      });
    });

    await prisma.$transaction(transactions);

    // Auto-sync the configured coupon code into prisma.coupon
    const couponCode = (settingsMap.THANKYOU_COUPON_CODE || 'WELCOME15').trim().toUpperCase();
    const couponAmount = parseFloat(settingsMap.THANKYOU_COUPON_AMOUNT || '15') || 15;
    if (couponCode) {
      try {
        await prisma.coupon.upsert({
          where: { code: couponCode },
          update: { value: couponAmount, type: 'FIXED_AMOUNT', isActive: true },
          create: { code: couponCode, value: couponAmount, type: 'FIXED_AMOUNT', isActive: true },
        });
      } catch (couponErr) {
        console.warn('Failed to upsert thank you coupon:', couponErr);
      }
    }

    revalidatePath('/thank-you');
    revalidatePath('/danke');
    revalidatePath('/', 'layout');
    updateTag('settings');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
