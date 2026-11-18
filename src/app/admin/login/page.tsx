import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import AdminLoginClient from './AdminLoginClient';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
  if (adminCount === 0) {
    redirect('/admin/setup');
  }

  return <AdminLoginClient />;
}
