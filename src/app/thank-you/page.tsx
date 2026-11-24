import { Metadata } from 'next';
import ThankYouClient from './ThankYouClient';
import { getCachedSettings } from '@/lib/cache';

export const revalidate = 3600;

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
  const settings = await getCachedSettings();

  return <ThankYouClient settings={settings} />;
}
