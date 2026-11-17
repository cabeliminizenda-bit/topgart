import { Metadata } from 'next';
import ThankYouClient from './ThankYouClient';

export const metadata: Metadata = {
  title: 'Vielen Dank für deine Anmeldung | HLG Hausgeräte',
  description: 'Willkommen bei HLG Hausgeräte! Hier ist dein 15 € Willkommens-Gutschein für deine nächste Bestellung.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function ThankYouPage() {
  return <ThankYouClient />;
}
