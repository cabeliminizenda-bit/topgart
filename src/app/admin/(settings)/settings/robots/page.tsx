import { requireAdminPage } from '@/lib/auth';
import { getSettings } from '@/actions/settings';
import RobotsForm from '@/components/admin/settings/RobotsForm';

export const metadata = {
  title: 'Robots.txt | Top Gartengeräte Admin',
};

export default async function RobotsSettingsPage() {
  await requireAdminPage();
  const settings = await getSettings();

  return (
    <div className="max-w-4xl">
      <RobotsForm initialSettings={settings} />
    </div>
  );
}
