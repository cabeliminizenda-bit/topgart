import { requireAdminPage } from '@/lib/auth';
import { getSettings } from '@/actions/settings';
import SeoForm from '@/components/admin/settings/SeoForm';

export const metadata = {
  title: 'SEO & OpenGraph | Top Gartengeräte Admin',
};

export default async function SeoSettingsPage() {
  await requireAdminPage();
  const settings = await getSettings();

  return (
    <div className="max-w-4xl">
      <SeoForm initialSettings={settings} />
    </div>
  );
}
