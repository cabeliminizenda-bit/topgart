import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bestellung verfolgen | Top Gartengeräte',
  robots: {
    index: false,
    follow: false,
  },
};

export default function OrderTrackingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
