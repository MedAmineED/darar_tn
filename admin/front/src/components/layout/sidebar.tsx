'use client';

import Link from 'next/link';
import { useId } from 'react';
import { LayoutGroup, m } from 'motion/react';
import { usePathname } from 'next/navigation';
import { navItems } from '@/config/nav';
import { useLocale } from '@/contexts/locale-context';
import { useAuth } from '@/providers/auth-provider';
import { cn } from '@/lib/utils';

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { strings, t } = useLocale();
  const pathname = usePathname();
  const motionId = useId();
  const { hasPermission } = useAuth();

  const visibleItems = navItems.filter((item) =>
    hasPermission(item.permission),
  );

  return (
    <aside className="flex h-full w-sidebar flex-col border-e border-outline-variant/60 bg-surface-lowest">
      <div className="flex h-header shrink-0 items-center gap-2.5 px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-container font-heading text-base font-bold text-white">
          {t('د', 'D')}
        </div>
        <div className="leading-tight">
          <p className="font-heading text-sm font-semibold text-on-surface">
            {strings.appName}
          </p>
          <p className="mt-0.5 text-[11px] text-on-surface-variant">
            {strings.appSubtitle}
          </p>
        </div>
      </div>

      <LayoutGroup id={motionId}>
        <nav
          aria-label={t('التنقل الرئيسي', 'Navigation principale')}
          className="scrollbar-thin flex-1 space-y-1 overflow-y-auto px-3 py-4"
        >
          {visibleItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            if (item.soon) {
              return (
                <div
                  key={item.key}
                  className="flex h-9 cursor-not-allowed items-center gap-2.5 rounded-lg px-2.5 text-[13px] text-on-surface-variant/40"
                  title={`${strings.nav[item.key]} · ${strings.common.comingSoon}`}
                  aria-label={`${strings.nav[item.key]} · ${strings.common.comingSoon}`}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="flex-1">{strings.nav[item.key]}</span>
                  <span className="rounded bg-surface-container px-1.5 py-0.5 text-[9px] font-medium">
                    {strings.common.comingSoon}
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={onNavigate}
                title={strings.nav[item.key]}
                aria-label={strings.nav[item.key]}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary',
                  active
                    ? 'text-primary'
                    : 'text-on-surface-variant hover:bg-surface-low hover:text-on-surface',
                )}
              >
                {active && (
                  <m.span
                    layoutId="active-navigation"
                    className="absolute inset-0 rounded-lg bg-primary/10"
                    aria-hidden
                  />
                )}
                <Icon className="relative h-[18px] w-[18px] shrink-0" />
                <span className="relative">{strings.nav[item.key]}</span>
              </Link>
            );
          })}
        </nav>
      </LayoutGroup>
    </aside>
  );
}
