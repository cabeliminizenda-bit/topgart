import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { requireAdminPage } from '@/lib/auth';
import SettingsSidebar from '@/components/admin/SettingsSidebar';

export const dynamic = 'force-dynamic';

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  // 1. Check if an admin exists in the database
  const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
  if (adminCount === 0) {
    redirect('/admin/setup');
  }

  // 2. Verify admin session (supports standalone Neon session)
  await requireAdminPage();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Settings Sidebar */}
      <SettingsSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  );
}
