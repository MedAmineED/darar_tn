import { Badge } from '@/components/ui/badge';
import type { Availability, MovementKind } from '@/lib/api/inventory';
import { useLocale } from '@/contexts/locale-context';

export function useInventoryLabels() {
  const { t } = useLocale();
  const availabilityLabels: Record<Availability, string> = {
    IN: t('متوفر', 'Disponible'),
    LOW: t('مخزون منخفض', 'Stock faible'),
    OUT: t('نفد المخزون', 'Rupture de stock'),
  };
  const movementLabels: Record<MovementKind, string> = {
    ADJUSTMENT: t('تعديل يدوي', 'Ajustement manuel'),
    DEDUCTION: t('خصم طلب', 'Commande confirmée'),
    RESTORATION: t('استرجاع إلغاء', 'Commande annulée'),
  };
  return { availabilityLabels, movementLabels };
}
export function AvailabilityBadge({
  availability,
}: {
  availability: Availability;
}) {
  const { availabilityLabels } = useInventoryLabels();
  return (
    <Badge
      tone={
        availability === 'OUT'
          ? 'danger'
          : availability === 'LOW'
            ? 'warning'
            : 'success'
      }
    >
      {availabilityLabels[availability]}
    </Badge>
  );
}
export function inventoryTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Africa/Tunis',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).format(date);
}
