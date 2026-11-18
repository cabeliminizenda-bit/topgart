import { requireAdminPage } from '@/lib/auth';
import { getSettings } from '@/actions/settings';
import ThankYouPageForm from '@/components/admin/settings/ThankYouPageForm';

export const metadata = {
  title: 'Dankesseite & Gutschein | Top Gartengeräte Admin',
};

export default async function ThankYouSettingsPage() {
  await requireAdminPage();
  const settings = await getSettings();

  return (
    <div className="max-w-6xl">
      <ThankYouPageForm initialSettings={settings} />
    </div>
  );
}
