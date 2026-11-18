import { requireAdminPage } from '@/lib/auth';
import { getSettings } from '@/actions/settings';
import ChatForm from '@/components/admin/settings/ChatForm';

export const metadata = {
  title: 'Kundenchat-Einstellungen | Top Gartengeräte Admin',
};

export default async function ChatSettingsPage() {
  await requireAdminPage();
  const settings = await getSettings();

  return (
    <div className="max-w-4xl">
      <ChatForm initialSettings={settings} />
    </div>
  );
}
