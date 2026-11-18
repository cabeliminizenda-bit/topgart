import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import AdminSetupClient from './AdminSetupClient';

export const dynamic = 'force-dynamic';

export default async function AdminSetupPage() {
  const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
  if (adminCount > 0) {
    redirect('/admin/login');
  }

  return <AdminSetupClient requireSetupToken={Boolean(process.env.SETUP_TOKEN)} />;
}
