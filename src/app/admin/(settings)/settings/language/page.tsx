import { requireAdminPage } from '@/lib/auth';
import { getSettings } from '@/actions/settings';
import LanguageForm from '@/components/admin/settings/LanguageForm';

export const metadata = {
  title: 'Spracheinstellungen | Top Gartengeräte Admin',
};

export default async function LanguageSettingsPage() {
  await requireAdminPage();
  const settings = await getSettings();

  return (
    <div className="max-w-4xl">
      <LanguageForm initialSettings={settings} />
    </div>
  );
}
