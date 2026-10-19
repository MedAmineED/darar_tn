'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import { clsx } from '@/lib/clsx';
import { Icon } from '@/components/ui/Icon';
import { useCart } from '@/components/cart/CartProvider';
import { LangToggle } from './LangToggle';

interface NavItem {
  href: string;
  label: string;
  match: (path: string) => boolean;
}

export function Header({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [solid, setSolid] = useState(!isHome);
  const [menuOpen, setMenuOpen] = useState(false);
  const { count, open } = useCart();

  // Sticky-header solidify (only meaningful on the transparent home header).
  useEffect(() => {
    if (!isHome) {
      setSolid(true);
      return;
    }
    const update = () => setSolid(window.scrollY > 60);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [isHome]);

  // Body scroll lock + Esc-to-close for the mobile drawer.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const nav: NavItem[] = [
    { href: '/', label: dict.nav.home, match: (p) => p === '/' },
    {
      href: '/shop',
      label: dict.nav.shop,
      match: (p) => p.startsWith('/shop') || p.startsWith('/products'),
    },
    {
      href: '/packs',
      label: dict.packs.title,
      match: (p) => p.startsWith('/packs'),
    },
    { href: '/#categories', label: dict.nav.categories, match: () => false },
    { href: '/#story', label: dict.nav.about, match: () => false },
    { href: '/#newsletter', label: dict.nav.contact, match: () => false },
  ];

  return (
    <>
      <header
        className={clsx(
          'site-header z-50',
          isHome ? 'fixed inset-x-0 top-0' : 'sticky top-0 bg-surface',
          isHome && !solid ? 'on-hero' : 'on-light',
          solid && 'is-solid',
        )}
      >
        <div className="max-w-container mx-auto px-5 md:px-16">
          <nav className="flex items-center justify-between h-20">
            <Link
              href="/"
              className="font-display text-2xl md:text-[28px] font-bold tracking-tight"
            >
              {dict.brand.name}
            </Link>

            <ul className="hidden lg:flex items-center gap-9 text-[15px]">
              {nav.map((item, i) => (
                <li key={`${item.href}-${i}`}>
                  <Link
                    href={item.href}
                    className={clsx(
                      'nav-link',
                      item.match(pathname) && 'is-active',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-1 sm:gap-2">
              <LangToggle
                locale={locale}
                label={dict.nav.lang}
                className="hidden sm:inline-flex items-center justify-center h-10 min-w-10 px-3 rounded border border-current/30 text-sm font-semibold hover:bg-primary hover:text-on-primary hover:border-primary transition-colors"
              />
              <Link
                href="/shop"
                aria-label={dict.nav.search}
                className="h-10 w-10 inline-flex items-center justify-center rounded hover:bg-black/5 transition-colors"
              >
                <Icon name="search" />
              </Link>
              <button
                type="button"
                onClick={open}
                className="relative h-10 w-10 inline-flex items-center justify-center rounded hover:bg-black/5 transition-colors"
                aria-label={dict.nav.cart}
              >
                <Icon name="shopping_bag" />
                {count > 0 && (
                  <span className="cart-badge absolute -top-0.5 -end-0.5 min-w-5 h-5 px-1 rounded-full bg-primary text-on-primary text-[11px] font-semibold grid place-items-center">
                    {count}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label={dict.nav.menu}
                aria-expanded={menuOpen}
                className="lg:hidden h-10 w-10 inline-flex items-center justify-center rounded hover:bg-black/5 transition-colors"
              >
                <Icon name="menu" />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        onClick={() => setMenuOpen(false)}
        className={clsx('scrim fixed inset-0 z-50 bg-black/40 lg:hidden', menuOpen && 'is-open')}
      />
      <aside
        className={clsx(
          'drawer fixed top-0 end-0 z-[55] h-full w-[82%] max-w-sm bg-surface shadow-2xl lg:hidden flex flex-col',
          menuOpen && 'is-open',
        )}
        aria-hidden={!menuOpen}
      >
        <div className="flex items-center justify-between h-20 px-6 border-b hairline">
          <span className="font-display text-xl font-bold">{dict.brand.name}</span>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label={dict.nav.close}
            className="h-10 w-10 inline-flex items-center justify-center rounded hover:bg-black/5"
          >
            <Icon name="close" />
          </button>
        </div>
        <nav className="flex-1 px-6 py-8">
          <ul className="flex flex-col gap-6 text-lg font-display">
            {nav.map((item, i) => (
              <li key={`m-${item.href}-${i}`}>
                <Link href={item.href} onClick={() => setMenuOpen(false)}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="px-6 py-6 border-t hairline">
          <LangToggle
            locale={locale}
            label={dict.nav.lang}
            className="btn btn-ghost w-full py-3 text-sm"
          />
        </div>
      </aside>
    </>
  );
}
