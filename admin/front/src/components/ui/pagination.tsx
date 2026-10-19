'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { useLocale } from '@/contexts/locale-context';
import type { PaginationMeta } from '@/lib/api/types';

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  const { strings, t } = useLocale();
  if (meta.total === 0) return null;
  const from = (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="flex items-center justify-between px-1 py-3 text-sm">
      <p className="text-on-surface-variant">
        {strings.common.showing} {from}–{to} {strings.common.of} {meta.total}
      </p>
      <div className="flex items-center gap-2">
        {/* RTL: "previous" points right */}
        <Button
          variant="secondary"
          size="sm"
          aria-label={t('الصفحة السابقة', 'Page précédente')}
          disabled={!meta.hasPreviousPage}
          onClick={() => onPageChange(meta.page - 1)}
        >
          <ChevronRight className="h-4 w-4 ltr:rotate-180" />
        </Button>
        <span className="min-w-16 text-center text-on-surface-variant">
          {meta.page} / {meta.totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          aria-label={t('الصفحة التالية', 'Page suivante')}
          disabled={!meta.hasNextPage}
          onClick={() => onPageChange(meta.page + 1)}
        >
          <ChevronLeft className="h-4 w-4 ltr:rotate-180" />
        </Button>
      </div>
    </div>
  );
}
