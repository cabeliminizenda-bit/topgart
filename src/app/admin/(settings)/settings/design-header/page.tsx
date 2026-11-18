import { requireAdminPage } from '@/lib/auth';
import { getSettings } from '@/actions/settings';
import DesignHeaderForm from '@/components/admin/settings/DesignHeaderForm';

export const metadata = {
  title: 'Header & Produktkarten | Top Gartengeräte Admin',
};

export default async function DesignHeaderSettingsPage() {
  await requireAdminPage();
  const settings = await getSettings();

  return (
    <div className="max-w-4xl">
      <DesignHeaderForm initialSettings={settings} />
    </div>
  );
}
