'use client';

import { type ReactNode } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { Search, X } from 'lucide-react';
import { useLocale } from '@/contexts/locale-context';

export interface FilterChip {
  label: string;
  onRemove: () => void;
}

/** Keep every filter visible; compact controls wrap on narrow screens. */
export function FilterToolbar({
  search,
  children,
  chips = [],
  onClear,
  resultLabel,
  trailing,
}: {
  search: ReactNode;
  children?: ReactNode;
  chips?: FilterChip[];
  onClear?: () => void;
  resultLabel?: string;
  trailing?: ReactNode;
}) {
  const { t } = useLocale();
  const reducedMotion = useReducedMotion();
  return (
    <div className="mb-3 space-y-2.5">
      <div className="flex flex-wrap items-end gap-2">
        <div className="relative w-full sm:w-64 sm:min-w-48 sm:max-w-sm sm:flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute start-3 top-2.5 h-4 w-4 text-on-surface-variant/50"
          />
          <div className="[&_input]:border-outline-variant/50 [&_input]:bg-surface-lowest [&_input]:ps-9">
            {search}
          </div>
        </div>
        <div className="contents [&>input]:w-full sm:[&>input]:w-40 [&>label]:w-full sm:[&>label]:w-44 [&>select]:w-full sm:[&>select]:w-44">
          {children}
        </div>
        {trailing}
        {resultLabel && (
          <span className="ms-auto self-center text-xs tabular-nums text-on-surface-variant/70">
            {resultLabel}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5 empty:hidden">
        <AnimatePresence initial={false}>
          {chips.map((chip, index) => (
            <m.button
              layout={!reducedMotion}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              key={`${chip.label}-${index}`}
              type="button"
              onClick={chip.onRemove}
              aria-label={`${t('إزالة الفلتر', 'Retirer le filtre')} : ${chip.label}`}
              className="inline-flex min-h-7 items-center gap-1.5 rounded-md border border-primary/10 bg-primary/5 px-2 text-[11px] text-primary hover:bg-primary/10 focus-visible:outline-primary"
            >
              {chip.label}
              <X className="h-3 w-3" />
            </m.button>
          ))}
        </AnimatePresence>
        {onClear && chips.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="rounded px-2 py-1 text-[11px] text-on-surface-variant hover:text-primary focus-visible:outline-primary"
          >
            {t('مسح الكل', 'Tout effacer')}
          </button>
        )}
      </div>
    </div>
  );
}

export function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="min-w-0 space-y-1.5">
      <span className="block text-[11px] font-medium text-on-surface-variant">
        {label}
      </span>
      {children}
    </label>
  );
}
