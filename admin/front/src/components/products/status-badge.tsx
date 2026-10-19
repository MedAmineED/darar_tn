'use client';

import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/contexts/locale-context';
import type { ProductStatus } from '@/lib/api/catalog-types';

const toneByStatus: Record<
  ProductStatus,
  'neutral' | 'success' | 'warning' | 'danger' | 'info'
> = {
  DRAFT: 'neutral',
  ACTIVE: 'success',
  INACTIVE: 'warning',
  ARCHIVED: 'danger',
};

export function StatusBadge({ status }: { status: ProductStatus }) {
  const { strings } = useLocale();
  return (
    <Badge tone={toneByStatus[status]}>{strings.catalog.status[status]}</Badge>
  );
}
