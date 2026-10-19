'use client';

import { usePathname } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { navItems } from '@/config/nav';
import { Fragment } from 'react';
import { useLocale } from '@/contexts/locale-context';

/** Simple breadcrumb trail derived from the current path (RTL-aware). */
export function Breadcrumbs() {
  const { strings, t } = useLocale();
  const labelBySegment: Record<string, string> = Object.fromEntries(
    navItems.map((item) => [item.href.slice(1), strings.nav[item.key]]),
  );
  labelBySegment.create = strings.common.create;
  labelBySegment.edit = strings.common.edit;
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  return (
    <nav
      aria-label={t('مسار التنقل', 'Fil d’Ariane')}
      className="flex min-w-0 items-center gap-1.5 overflow-hidden text-sm"
    >
      {segments.map((segment, index) => {
        const label = labelBySegment[segment] ?? t('تفاصيل', 'Détails');
        const isLast = index === segments.length - 1;
        return (
          <Fragment key={`${segment}-${index}`}>
            {index > 0 && (
              <ChevronLeft className="h-4 w-4 text-on-surface-variant/50 ltr:rotate-180" />
            )}
            <span
              className={
                'truncate ' +
                (isLast
                  ? 'font-medium text-on-surface'
                  : 'text-on-surface-variant')
              }
            >
              {label}
            </span>
          </Fragment>
        );
      })}
    </nav>
  );
}
