import { requireAdminPage } from '@/lib/auth';
import { getSettings } from '@/actions/settings';
import NotFoundPageForm from '@/components/admin/settings/NotFoundPageForm';

export const metadata = {
  title: '404-Seite Einstellungen | Top Gartengeräte Admin',
};

export default async function NotFoundPageSettingsPage() {
  await requireAdminPage();
  const settings = await getSettings();

  return (
    <div className="max-w-4xl">
      <NotFoundPageForm initialSettings={settings} />
    </div>
  );
}
