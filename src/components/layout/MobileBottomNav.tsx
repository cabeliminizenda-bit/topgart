'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useEffect, useState } from 'react';

type MobileBottomNavProps = {
  onSearchClick: () => void;
  onLoginClick: () => void;
  userRole?: 'ADMIN' | 'CUSTOMER' | null;
  onCartClick?: () => void;
};

export default function MobileBottomNav({
  onSearchClick,
  onLoginClick,
  userRole = null,
  onCartClick
}: MobileBottomNavProps) {
  const [mounted, setMounted] = useState(false);
  const cartStore = useCartStore();
  const wishlistStore = useWishlistStore();
  const pathname = usePathname();
  const router = useRouter();

  const cartItems = cartStore.getTotalItems();
  const wishlistItems = wishlistStore.items.length;

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAccountClick = () => {
    if (userRole) {
      router.push(userRole === 'ADMIN' ? '/admin' : '/account');
    } else {
      onLoginClick();
    }
  };

  const handleCartClick = () => {
    if (onCartClick) {
      onCartClick();
    } else {
      cartStore.setIsOpen(true);
    }
  };

  return (
    <nav
      aria-label="Untere mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg text-stone-500 border-t border-stone-200 z-[60] px-2 py-1.5 flex justify-around items-center pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
    >
      {/* 1. Startseite */}
      <Link
        href="/"
        aria-label="Startseite"
        className={`flex flex-col items-center justify-center py-1 px-2 min-w-[56px] transition-colors ${pathname === '/' ? 'text-[#00a86b] font-semibold' : 'hover:text-stone-900'
          }`}
      >
        <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={pathname === '/' ? 2.2 : 1.7} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span className="text-[10px] tracking-tight">Startseite</span>
      </Link>

      {/* 2. Suche */}
      <button
        type="button"
        onClick={onSearchClick}
        aria-label="Produkte suchen"
        className="flex flex-col items-center justify-center py-1 px-2 min-w-[56px] hover:text-stone-900 transition-colors cursor-pointer"
      >
        <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="text-[10px] tracking-tight">Suche</span>
      </button>

      {/* 3. Shop / Katalog */}
      <Link
        href="/shop"
        aria-label="Shop-Katalog"
        className={`flex flex-col items-center justify-center py-1 px-2 min-w-[56px] transition-colors ${pathname.startsWith('/shop') || pathname.startsWith('/product-category') ? 'text-[#00a86b] font-semibold' : 'hover:text-stone-900'
          }`}
      >
        <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={pathname.startsWith('/shop') ? 2.2 : 1.7} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        <span className="text-[10px] tracking-tight">Shop</span>
      </Link>

      {/* 4. Warenkorb */}
      <button
        type="button"
        onClick={handleCartClick}
        aria-label={`Warenkorb (${mounted ? cartItems : 0} Artikel)`}
        className="flex flex-col items-center justify-center py-1 px-2 min-w-[56px] relative text-stone-700 hover:text-[#00a86b] transition-colors cursor-pointer group"
      >
        <div className="relative">
          <svg className="w-5 h-5 mb-0.5 group-hover:scale-105 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          {mounted && cartItems > 0 && (
            <span className="absolute -top-1.5 -right-2.5 bg-[#00a86b] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-2xs">
              {cartItems > 99 ? '99+' : cartItems}
            </span>
          )}
        </div>
        <span className="text-[10px] tracking-tight font-medium">Warenkorb</span>
      </button>

      {/* 5. Konto / Anmelden */}
      <button
        type="button"
        onClick={handleAccountClick}
        aria-label="Mein Konto"
        className={`flex flex-col items-center justify-center py-1 px-2 min-w-[56px] transition-colors cursor-pointer ${pathname.startsWith('/account') || pathname.startsWith('/admin') ? 'text-[#00a86b] font-semibold' : 'hover:text-stone-900'
          }`}
      >
        <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={pathname.startsWith('/account') ? 2.2 : 1.7} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="text-[10px] tracking-tight">
          {userRole ? (userRole === 'ADMIN' ? 'Admin' : 'Konto') : 'Anmelden'}
        </span>
      </button>
    </nav>
  );
}
