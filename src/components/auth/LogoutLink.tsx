'use client';

import { logoutUser } from '@/actions/auth';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useTranslations } from 'next-intl';

export default function LogoutLink() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('Account');

  const handleLogout = () => {
    startTransition(async () => {
      await logoutUser();
      router.push('/login');
    });
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="text-[#107b46] hover:text-[#0d6338] font-medium transition-colors disabled:opacity-50 inline"
    >
      {t('nav_logout')}
    </button>
  );
}
