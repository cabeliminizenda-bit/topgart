'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useEffect, useState, useRef, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { searchProducts } from '@/actions/public';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import MobileHeaderBar from '@/components/layout/MobileHeaderBar';
import Price from '@/components/Price';
import { getUserRole } from '@/actions/auth';

const LoginModal = dynamic(() => import('@/components/auth/LoginModal'), { ssr: false });
const CartDrawer = dynamic(() => import('@/components/cart/CartDrawer'), { ssr: false });
const WishlistDrawer = dynamic(() => import('@/components/wishlist/WishlistDrawer'), { ssr: false });
const MobileSidebar = dynamic(() => import('@/components/layout/MobileSidebar'), { ssr: false });
const MobileSearchOverlay = dynamic(() => import('@/components/layout/MobileSearchOverlay'), { ssr: false });

type HeaderProps = {
  announcement?: string;
  logoImage?: string;
  headerLogoHeight?: string;
  mobileLogoHeight?: string;
  menuLinks?: Array<{ label: string; url: string }>;
  topBarLinks?: Array<{ label: string; icon: string; url: string }>;
  loginText?: string;
  myAccountText?: string;
  adminDashboardText?: string;
  topBarBgColor?: string;
  topBarTextColor?: string;
  categories?: Array<{ id: string; name: string; slug: string | null; parentId?: string | null }>;
  searchBorderColor?: string;
  searchPlaceholder?: string;
  searchBtnText?: string;
  searchBtnBgColor?: string;
  searchBtnTextColor?: string;
  showNew?: boolean;
  showHot?: boolean;
  showSale?: boolean;
  mobileAboutTitle?: string;
  mobileAboutDesc?: string;
  mobileMenuLinks?: Array<{ label: string; url: string }>;
  mobileContactAddress?: string;
  mobileContactPhone?: string;
  mobileContactEmail?: string;
  mobileContactWebsite?: string;
  supportEmail?: string;
  mobileHeaderBorderColor?: string;
  allCategoriesBgColor?: string;
  allCategoriesTextColor?: string;
  userRole?: 'ADMIN' | 'CUSTOMER' | null;
};

const emptySubscribe = () => () => {};

const gardenCategoriesList = [
  { name: 'Alle Kategorien', slug: 'all' },
  { name: 'Rasentraktoren', slug: 'rasentraktoren' },
  { name: 'Mähroboter', slug: 'maehroboter' },
  { name: 'Rasenmäher', slug: 'rasenmaeher' },
  { name: 'Kettensäge & Rasentrimmer', slug: 'kettensaege-rasentrimmer' },
  { name: 'Hochlader', slug: 'hochlader' },
  { name: 'Zubehör', slug: 'zubehoer' },
  { name: 'Zubehör für Gartengeräte', slug: 'zubehoer-fuer-gartengeraete' },
];

const topUtilityLinks = [
  { label: 'AGB', url: '/agb' },
  { label: 'Blog', url: '/blog' },
  { label: 'Versand', url: '/lieferzeiten' },
  { label: 'Widerrufsbelehrung', url: '/rueckgabe-und-erstattung' },
];

const defaultNavLinks = [
  { label: 'AGB', url: '/agb' },
  { label: 'ZAHLUNGSART', url: '/zahlungsinformationen' },
  { label: 'ÜBER UNS', url: '/ueber-uns' },
  { label: 'KONTAKT', url: '/kontakt' },
  { label: 'BLOG', url: '/blog' },
  { label: 'BESTELLUNG VERFOLGEN', url: '/order-tracking' },
];

export default function Header({
  logoImage = '/logo-top-gartengeraete-dark.svg',
  menuLinks = [],
  categories = [],
  searchPlaceholder = 'Produkte suchen...',
  searchBtnText = 'Suche',
  mobileContactAddress = '',
  mobileContactEmail = '',
  supportEmail = '',
  userRole = null,
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const cartStore = useCartStore();
  const wishlistStore = useWishlistStore();

  const cartItems = cartStore.getTotalItems();
  const cartTotal = cartStore.getTotalPrice();
  const wishlistItems = wishlistStore.items.length;

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isShopMenuOpen, setIsShopMenuOpen] = useState(false);
  const [actualUserRole, setActualUserRole] = useState<'ADMIN' | 'CUSTOMER' | null>(userRole);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCategoryLabel, setSelectedCategoryLabel] = useState('Alle Kategorien');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const shopMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getUserRole().then((role) => {
      setActualUserRole(role as 'ADMIN' | 'CUSTOMER' | null);
    });
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
      if (shopMenuRef.current && !shopMenuRef.current.contains(event.target as Node)) {
        setIsShopMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const searchCategories =
    categories && categories.length > 0
      ? [
          { name: 'Alle Kategorien', value: 'all', isChild: false },
          ...categories
            .filter((cat) => {
              const slugLower = (cat.slug || '').toLowerCase();
              const nameLower = cat.name.toLowerCase();
              return slugLower !== 'uncategorized' && nameLower !== 'uncategorized' && nameLower !== 'allgemein';
            })
            .map((cat) => ({
              name: cat.name,
              value: cat.slug || cat.id,
              isChild: Boolean(cat.parentId),
            })),
        ]
      : gardenCategoriesList.map((cat) => ({
          name: cat.name,
          value: cat.slug,
          isChild: false,
        }));

  const shopDropdownCategories = searchCategories.filter((c) => c.value !== 'all').slice(0, 10);

  // Debounced Search Effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        setIsSearching(true);
        setShowSearchResults(true);
        try {
          const results = await searchProducts(
            searchQuery,
            selectedCategory === 'all' ? '' : selectedCategory,
            6
          );
          setSearchResults(results);
        } catch (error) {
          console.error('Search error', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() || selectedCategory !== 'all') {
      setShowSearchResults(false);
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.append('q', searchQuery.trim());
      }
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      router.push(`/search?${params.toString()}`);
    }
  };

  const navLinks = menuLinks && menuLinks.length > 0 ? menuLinks : defaultNavLinks;

  const currentLogo =
    logoImage &&
    logoImage !== '/logo.jpg' &&
    logoImage !== '/logo-flame.png' &&
    logoImage !== '/LOGO-HLG-HAUSGERAETE.png' &&
    logoImage !== '/logo-top-gartengeraete.svg'
      ? logoImage
      : '/logo-top-gartengeraete-dark.svg';

  const handleAccountAction = () => {
    if (actualUserRole) {
      router.push(actualUserRole === 'ADMIN' ? '/admin' : '/account');
    } else {
      setIsLoginModalOpen(true);
    }
  };

  return (
    <>
      <header className="w-full font-sans relative z-50 bg-white">
        {/* Mobile Header Bar (< lg) */}
        <MobileHeaderBar
          logoSrc={currentLogo}
          isMenuOpen={isMobileMenuOpen}
          onToggleMenu={() => setIsMobileMenuOpen((prev) => !prev)}
          onAccountClick={handleAccountAction}
          onCartClick={() => cartStore.setIsOpen(true)}
          onWishlistClick={() => wishlistStore.setIsOpen(true)}
          cartCount={mounted ? cartItems : 0}
          wishlistCount={mounted ? wishlistItems : 0}
        />

        {/* TIER 1: Top Slim Utility Bar (Desktop lg+) */}
        <div className="hidden lg:block bg-[#fafafa] border-b border-stone-200/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-[11.5px] text-stone-500">
              <span className="inline-flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-[#00a86b]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Kostenloser Versand ab 200 €</span>
              </span>
              <span className="h-3 w-px bg-stone-200" aria-hidden="true" />
              <span className="inline-flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-[#00a86b]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>2 Jahre Garantie</span>
              </span>
            </div>
            <nav aria-label="Rechtliche Kurzlinks" className="flex items-center text-[12px] text-stone-500">
              {topUtilityLinks.map((item, idx) => (
                <div key={item.url} className="flex items-center">
                  {idx > 0 && <span className="mx-3 h-3 w-px bg-stone-200" aria-hidden="true" />}
                  <Link
                    href={item.url}
                    className="hover:text-[#00a86b] transition-colors"
                  >
                    {item.label}
                  </Link>
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* TIER 2: Main White Header (Logo + Rectangular Search Bar + Account + Cart) */}
        <div className="hidden lg:block bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center w-[250px]">
              <Link
                href="/"
                className="flex items-center group transition-opacity hover:opacity-95"
                title="Top Gartengeräte"
              >
                <Image
                  src={currentLogo}
                  alt="Top Gartengeräte"
                  width={230}
                  height={58}
                  className="h-12 w-auto object-contain"
                  priority
                />
              </Link>
            </div>

            {/* Center Search Bar */}
            <div className="flex-1 max-w-[560px] relative" ref={searchContainerRef}>
              <form
                onSubmit={handleSearchSubmit}
                className="w-full h-[45px] bg-white rounded-[5px] flex items-stretch border border-stone-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] focus-within:border-[#00a86b] focus-within:ring-2 focus-within:ring-[#00a86b]/15 transition-all text-stone-800"
              >
                {/* Category Dropdown */}
                <div className="relative shrink-0 flex items-center" ref={categoryDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    className="h-full flex items-center gap-2 px-3.5 text-[13px] font-normal text-stone-600 hover:text-stone-900 transition select-none cursor-pointer"
                  >
                    <span className="truncate max-w-[135px]">{selectedCategoryLabel}</span>
                    <svg
                      className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${
                        isCategoryDropdownOpen ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isCategoryDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1.5 w-60 bg-white border border-stone-200 shadow-xl rounded-md py-1.5 z-50 text-[13px] text-stone-700 animate-in fade-in duration-150">
                      <div className="px-3.5 py-1 text-[10px] font-bold tracking-wider text-stone-400 uppercase">
                        Kategorie wählen
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {searchCategories.map((cat) => (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(cat.value);
                              setSelectedCategoryLabel(cat.name);
                              setIsCategoryDropdownOpen(false);
                            }}
                            className={`w-full text-left py-2 hover:bg-emerald-50 hover:text-[#00a86b] transition flex items-center justify-between cursor-pointer ${
                              cat.isChild ? 'pl-6 pr-3.5 text-stone-600' : 'px-3.5'
                            } ${
                              selectedCategory === cat.value
                                ? 'font-semibold text-[#00a86b] bg-emerald-50/70'
                                : ''
                            }`}
                          >
                            <span className="truncate">{cat.name}</span>
                            {selectedCategory === cat.value && (
                              <svg
                                className="w-3.5 h-3.5 text-[#00a86b] shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Vertical Divider */}
                <div className="w-px my-2.5 bg-stone-200 shrink-0" />

                {/* Search Input */}
                <input
                  type="text"
                  placeholder={searchPlaceholder || 'Produkte suchen...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearchResults(true)}
                  className="flex-1 px-3.5 text-[13px] bg-transparent outline-none placeholder-stone-400 text-stone-800"
                />

                {/* Clear query button */}
                {searchQuery.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setShowSearchResults(false);
                    }}
                    className="px-2 text-stone-400 hover:text-stone-600 transition cursor-pointer"
                    title="Löschen"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}

                {/* Green "Suche" Submit Button */}
                <button
                  type="submit"
                  className="bg-[#00a86b] hover:bg-[#008f5a] active:bg-[#007a4d] text-white font-semibold px-5 text-[13px] rounded-r-[3px] flex items-center justify-center gap-1.5 transition shrink-0 cursor-pointer"
                >
                  {isSearching ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>{searchBtnText || 'Suche'}</span>
                  )}
                </button>
              </form>

              {/* Popular Searches Dropdown when focused & empty */}
              {showSearchResults && searchQuery.trim().length <= 1 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-stone-200 shadow-2xl rounded-lg z-50 p-4 animate-in fade-in duration-150">
                  <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <span>Beliebte Suchbegriffe</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Rasentraktor',
                      'Mähroboter',
                      'Akku-Rasenmäher',
                      'Kettensäge',
                      'Rasentrimmer',
                      'Hochlader',
                      'Heckenschere',
                      'Gartenzubehör',
                    ].map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => {
                          setSearchQuery(term);
                          router.push(`/search?q=${encodeURIComponent(term)}`);
                          setShowSearchResults(false);
                        }}
                        className="px-3 py-1.5 rounded-full bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-[#00a86b] text-xs font-medium border border-stone-200/70 hover:border-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <svg className="w-3 h-3 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span>{term}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Autocomplete Search Results Dropdown */}
              {showSearchResults && searchQuery.length > 1 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-stone-200 shadow-2xl rounded-lg z-50 overflow-hidden">
                  {isSearching && searchResults.length === 0 ? (
                    <div className="p-4 text-center text-stone-500 text-sm">Suche nach Geräten...</div>
                  ) : searchResults.length > 0 ? (
                    <div>
                      <div className="px-4 py-2 bg-stone-50 border-b border-stone-100 flex items-center justify-between text-xs font-semibold text-stone-600">
                        <span>Gefundene Produkte</span>
                        <Link
                          href={
                            selectedCategory !== 'all'
                              ? `/search?q=${encodeURIComponent(searchQuery.trim())}&category=${encodeURIComponent(selectedCategory)}`
                              : `/search?q=${encodeURIComponent(searchQuery.trim())}`
                          }
                          onClick={() => setShowSearchResults(false)}
                          className="text-[#00a86b] hover:underline"
                        >
                          Alle anzeigen &rarr;
                        </Link>
                      </div>
                      <ul className="max-h-80 overflow-y-auto divide-y divide-stone-100">
                        {searchResults.map((product) => (
                          <li key={product.id}>
                            <Link
                              href={`/produkt/${product.slug || product.id}`}
                              onClick={() => {
                                setShowSearchResults(false);
                                setSearchQuery('');
                              }}
                              className="flex items-center px-4 py-2.5 hover:bg-emerald-50/40 transition group"
                            >
                              <div className="w-11 h-11 flex-shrink-0 bg-stone-50 rounded overflow-hidden mr-3 p-1 border border-stone-100">
                                {product.images && product.images.length > 0 ? (
                                  <Image
                                    width={100}
                                    height={100}
                                    src={product.images[0]}
                                    alt={product.title}
                                    className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-stone-300">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-stone-900 truncate group-hover:text-[#00a86b] transition-colors">
                                  {product.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Price amount={product.price} showTax={false} className="text-[#e05246] font-semibold text-sm tabular-nums" />
                                  {product.compareAtPrice && product.compareAtPrice > product.price && (
                                    <Price amount={product.compareAtPrice} showTax={false} className="text-stone-400 line-through text-xs" />
                                  )}
                                </div>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-stone-500">
                      Keine Produkte gefunden für &quot;<span className="font-semibold text-stone-800">{searchQuery}</span>&quot;
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Side: Konto + Warenkorb */}
            <div className="flex items-center gap-5 shrink-0">
              {/* Account */}
              <button
                type="button"
                onClick={handleAccountAction}
                className="flex items-center gap-2.5 group cursor-pointer text-left"
                title={actualUserRole ? 'Mein Konto' : 'Anmelden / Registrieren'}
              >
                <span className="w-10 h-10 rounded-full bg-stone-100/90 group-hover:bg-emerald-50 border border-stone-200/70 group-hover:border-[#00a86b]/30 flex items-center justify-center text-stone-600 group-hover:text-[#00a86b] transition-all shrink-0">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <div className="leading-tight">
                  <span className="block text-[11px] text-stone-400">Konto</span>
                  <span className="block text-[13px] font-semibold text-stone-800 group-hover:text-[#00a86b] transition-colors whitespace-nowrap">
                    {actualUserRole
                      ? actualUserRole === 'ADMIN'
                        ? 'Admin-Panel'
                        : 'Mein Konto'
                      : 'Anmelden / Registrieren'}
                  </span>
                </div>
              </button>

              {/* Cart */}
              <button
                type="button"
                onClick={() => cartStore.setIsOpen(true)}
                className="flex items-center gap-2.5 group cursor-pointer text-left"
                title="Warenkorb"
                aria-label="Warenkorb"
              >
                <div className="relative shrink-0">
                  <span className="w-10 h-10 rounded-full bg-stone-100/90 group-hover:bg-emerald-50 border border-stone-200/70 group-hover:border-[#00a86b]/30 flex items-center justify-center text-stone-600 group-hover:text-[#00a86b] transition-all">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </span>
                  <span className="absolute -top-1 -right-1 bg-[#00a86b] text-white text-[10px] font-bold min-w-[19px] h-[19px] px-1 rounded-full flex items-center justify-center ring-2 ring-white shadow-xs">
                    {mounted ? cartItems : 0}
                  </span>
                </div>
                <div className="leading-tight">
                  <span className="block text-[11px] text-stone-400">Warenkorb</span>
                  <span className="block text-[13px] font-semibold text-stone-800 group-hover:text-[#00a86b] transition-colors tabular-nums whitespace-nowrap">
                    {mounted ? (
                      <Price amount={cartTotal} showTax={false} />
                    ) : (
                      '0,00 €'
                    )}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* TIER 3: Light-Gray Navigation Strip with Green "ZUM SHOP GEHEN" Button */}
        <div className="hidden lg:block bg-white pb-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-[#f4f5f6] border border-stone-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)] rounded-[6px] flex items-center p-1 gap-7">
              {/* Green "ZUM SHOP GEHEN" CTA (aligned with Hero Left Sidebar width) */}
              <div
                className="relative w-[246px] shrink-0"
                ref={shopMenuRef}
                onMouseEnter={() => !isHomePage && setIsShopMenuOpen(true)}
                onMouseLeave={() => !isHomePage && setIsShopMenuOpen(false)}
              >
                <Link
                  href="/shop"
                  className="w-full bg-[#00a86b] hover:bg-[#008f5a] text-white font-bold text-[12.5px] tracking-wider uppercase px-5 py-3 rounded-[5px] flex items-center justify-between transition-all shadow-xs hover:shadow-md hover:shadow-emerald-600/20"
                >
                  <span>ZUM SHOP GEHEN</span>
                  <span className="w-5 h-5 rounded-full bg-white text-[#00a86b] flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </Link>

                {/* Dropdown on non-home pages */}
                {!isHomePage && isShopMenuOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-stone-200 rounded-[5px] shadow-xl py-1 z-50 divide-y divide-stone-100">
                    <Link
                      href="/"
                      onClick={() => setIsShopMenuOpen(false)}
                      className="block px-5 py-2.5 text-[13px] text-stone-700 hover:text-[#00a86b] hover:bg-emerald-50/40 transition-colors"
                    >
                      Startseite
                    </Link>
                    {shopDropdownCategories.map((cat) => (
                      <Link
                        key={cat.value}
                        href={`/shop?category=${encodeURIComponent(cat.value)}`}
                        onClick={() => setIsShopMenuOpen(false)}
                        className="block px-5 py-2.5 text-[13px] text-stone-700 hover:text-[#00a86b] hover:bg-emerald-50/40 transition-colors truncate"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Horizontal Uppercase Navigation Links */}
              <nav aria-label="Hauptnavigation" className="flex items-center flex-wrap gap-x-7 gap-y-1 text-[13px] font-medium tracking-wide uppercase text-stone-700">
                {navLinks.map((link, idx) => {
                  const isActive = pathname === link.url;
                  return (
                    <Link
                      key={idx}
                      href={link.url}
                      className={`py-2.5 transition-colors whitespace-nowrap ${
                        isActive
                          ? 'text-[#00a86b] font-bold'
                          : 'text-stone-700 hover:text-[#00a86b]'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Modals & Drawers */}
        <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
        <CartDrawer isOpen={cartStore.isOpen} onClose={() => cartStore.setIsOpen(false)} />
        <WishlistDrawer isOpen={wishlistStore.isOpen} onClose={() => wishlistStore.setIsOpen(false)} />
        <MobileBottomNav
          onSearchClick={() => setIsMobileSearchOpen(true)}
          onLoginClick={() => setIsLoginModalOpen(true)}
          userRole={actualUserRole}
          onCartClick={() => cartStore.setIsOpen(true)}
        />
        <MobileSearchOverlay
          isOpen={isMobileSearchOpen}
          onClose={() => setIsMobileSearchOpen(false)}
          placeholder={searchPlaceholder || 'Produkte suchen...'}
        />
        <MobileSidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          logoImage="/logo-top-gartengeraete.svg"
          darkLogoImage={currentLogo}
          menuLinks={navLinks}
          contactAddress={mobileContactAddress}
          contactEmail={mobileContactEmail || supportEmail}
          searchCategories={searchCategories}
          searchPlaceholder={searchPlaceholder || 'Produkte suchen...'}
          cartCount={mounted ? cartItems : 0}
          wishlistCount={mounted ? wishlistItems : 0}
          onCartClick={() => cartStore.setIsOpen(true)}
          onWishlistClick={() => wishlistStore.setIsOpen(true)}
          onAccountClick={handleAccountAction}
        />
      </header>
    </>
  );
}
