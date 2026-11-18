import { requireAdminPage } from '@/lib/auth';
import { getSettings } from '@/actions/settings';
import SmtpForm from '@/components/admin/settings/SmtpForm';

export const metadata = {
  title: 'E-Mail-Server (SMTP) | Top Gartengeräte Admin',
};

export default async function SmtpSettingsPage() {
  await requireAdminPage();
  const settings = await getSettings();

  return (
    <div className="max-w-4xl">
      <SmtpForm initialSettings={settings} />
    </div>
  );
}
