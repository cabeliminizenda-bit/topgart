import { requireAdminPage } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function SettingsRootPage() {
  await requireAdminPage();
  redirect('/admin/settings/language');
}
