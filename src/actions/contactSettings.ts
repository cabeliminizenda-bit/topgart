'use server';

import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getContactSettings() {
  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: [
          'CONTACT_TITLE',
          'CONTACT_TEXT',
          'CONTACT_SLUG',
          'CONTACT_ADDRESS',
          'CONTACT_PHONE',
          'CONTACT_EMAIL_DISPLAY',
          'CONTACT_FORM_RECIPIENT',
          'CONTACT_BOTTOM_TEXT',
          'CONTACT_PHONE_PLACEHOLDER'
        ]
      }
    }
  });

  const settingsMap = settings.reduce((acc: any, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {});

  let isAdmin = false;
  try {
    await requireAdmin();
    isAdmin = true;
  } catch {
    isAdmin = false;
  }

  const defaultEmail = process.env.ADMIN_EMAIL || 'info@hlghausgeraete.de';

  return {
    title: settingsMap.CONTACT_TITLE !== undefined ? settingsMap.CONTACT_TITLE : 'Kontakt & Impressum',
    slug: settingsMap.CONTACT_SLUG !== undefined ? settingsMap.CONTACT_SLUG : 'kontakt',
    text: settingsMap.CONTACT_TEXT !== undefined ? settingsMap.CONTACT_TEXT : '',
    address: settingsMap.CONTACT_ADDRESS !== undefined ? settingsMap.CONTACT_ADDRESS : 'Borseler Chaussee 123, 22453 Hamburg, Deutschland',
    phone: settingsMap.CONTACT_PHONE !== undefined ? settingsMap.CONTACT_PHONE : '',
    emailDisplay: settingsMap.CONTACT_EMAIL_DISPLAY !== undefined ? settingsMap.CONTACT_EMAIL_DISPLAY : 'info@hlghausgeraete.de',
    formRecipient: isAdmin ? (settingsMap.CONTACT_FORM_RECIPIENT || defaultEmail) : '',
    bottomText: settingsMap.CONTACT_BOTTOM_TEXT !== undefined ? settingsMap.CONTACT_BOTTOM_TEXT : '',
    phonePlaceholder: settingsMap.CONTACT_PHONE_PLACEHOLDER !== undefined ? settingsMap.CONTACT_PHONE_PLACEHOLDER : '+49 ...'
  };
}

export async function updateContactSettings(data: {
  title: string;
  slug: string;
  text: string;
  address: string;
  phone: string;
  emailDisplay: string;
  formRecipient: string;
  bottomText: string;
  phonePlaceholder: string;
}) {
  await requireAdmin();

  try {
    const keys = [
      { key: 'CONTACT_TITLE', value: data.title },
      { key: 'CONTACT_SLUG', value: data.slug },
      { key: 'CONTACT_TEXT', value: data.text },
      { key: 'CONTACT_ADDRESS', value: data.address },
      { key: 'CONTACT_PHONE', value: data.phone },
      { key: 'CONTACT_EMAIL_DISPLAY', value: data.emailDisplay },
      { key: 'CONTACT_FORM_RECIPIENT', value: data.formRecipient },
      { key: 'CONTACT_BOTTOM_TEXT', value: data.bottomText },
      { key: 'CONTACT_PHONE_PLACEHOLDER', value: data.phonePlaceholder }
    ];

    for (const item of keys) {
      await prisma.setting.upsert({
        where: { key: item.key },
        update: { value: item.value },
        create: { key: item.key, value: item.value }
      });
    }

    revalidatePath('/contact');
    revalidatePath('/admin/pages/contact');
    
    return { success: true };
  } catch (error: any) {
    console.error('Error updating contact settings:', error);
    return { error: 'Failed to update contact settings' };
  }
}
