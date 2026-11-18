import { requireAdminPage } from '@/lib/auth';
import MediaPageClient from './MediaPageClient';

export const metadata = {
  title: 'Media Library | Admin',
};

export default async function MediaPage() {
  await requireAdminPage();
  return <MediaPageClient />;
}
