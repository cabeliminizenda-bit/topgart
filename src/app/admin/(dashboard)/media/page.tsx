import { requireAdminPage } from '@/lib/auth';
import MediaPageClient from './MediaPageClient';

export const metadata = {
  title: 'Medienbibliothek | Top Gartengeräte Admin',
};

export default async function MediaPage() {
  await requireAdminPage();
  return <MediaPageClient />;
}
