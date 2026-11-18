import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import ThankYouClient from './ThankYouClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Top Gartengeräte";
  return {
    title: `Vielen Dank für deine Anmeldung | ${storeName}`,
    description: `Willkommen bei ${storeName}! Hier ist dein Willkommens-Gutschein für deine nächste Bestellung.`,
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function ThankYouPage() {
  const settingsDb = await prisma.setting.findMany({
    where: {
      key: {
        startsWith: 'THANKYOU_'
      }
    }
  });

  const settings = settingsDb.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);

  return <ThankYouClient settings={settings} />;
}
