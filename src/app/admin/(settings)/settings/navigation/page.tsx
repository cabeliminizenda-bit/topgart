import { requireAdminPage } from '@/lib/auth';
import { getSettings } from '@/actions/settings';
import NavigationForm from '@/components/admin/settings/NavigationForm';

export const metadata = {
  title: 'Navigationsmenü | Top Gartengeräte Admin',
};

export default async function NavigationSettingsPage() {
  await requireAdminPage();
  const settings = await getSettings();

  return (
    <div className="max-w-4xl">
      <NavigationForm initialSettings={settings} />
    </div>
  );
}
