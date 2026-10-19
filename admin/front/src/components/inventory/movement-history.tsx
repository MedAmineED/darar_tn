'use client';

import { useState } from 'react';
import { useLocale } from '@/contexts/locale-context';
import Link from 'next/link';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Pagination } from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import type {
  InventoryItem,
  MovementKind,
  MovementSort,
} from '@/lib/api/inventory';
import { getApiErrorMessage } from '@/lib/api/client';
import { useStockMovements } from '@/hooks/use-inventory';
import { useAuth } from '@/providers/auth-provider';
import { inventoryTime, useInventoryLabels } from './inventory-badges';

export function MovementHistory({
  item,
  onClose,
}: {
  item: InventoryItem;
  onClose: () => void;
}) {
  const { t, locale } = useLocale();
  const { movementLabels } = useInventoryLabels();
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState<MovementKind | ''>('');
  const [sortBy, setSortBy] = useState<MovementSort>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const query = useStockMovements(item.productId, {
    page,
    limit: 10,
    search: search.trim() || undefined,
    kind: kind || undefined,
    sortBy,
    sortOrder,
  });
  return (
    <Modal
      open
      onClose={onClose}
      title={`${t('حركات المخزون', 'Mouvements de stock')} · ${locale === 'fr' ? item.product.nameFr : item.product.nameAr}`}
      className="max-w-6xl"
    >
      <p className="mb-4 text-sm text-on-surface-variant">
        {t(
          'تُعرض أوقات الحركات بتوقيت تونس. تغييرات حد التنبيه محفوظة في سجل التدقيق ولا تغيّر الرصيد.',
          'Les heures sont affichées au fuseau de Tunis. Les changements de seuil sont audités sans modifier les quantités.',
        )}
      </p>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          aria-label={t('بحث في الحركات', 'Rechercher des mouvements')}
          value={search}
          placeholder={t(
            'بحث بالسبب أو معرف الطلب أو المنفذ',
            'Motif, identifiant de commande ou auteur',
          )}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <Select
          aria-label={t('نوع الحركة', 'Type de mouvement')}
          value={kind}
          onChange={(event) => {
            setKind(event.target.value as MovementKind | '');
            setPage(1);
          }}
        >
          <option value="">
            {t('كل أنواع الحركات', 'Tous les mouvements')}
          </option>
          {Object.entries(movementLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          aria-label={t('ترتيب الحركات حسب', 'Trier les mouvements par')}
          value={sortBy}
          onChange={(event) => {
            setSortBy(event.target.value as MovementSort);
            setPage(1);
          }}
        >
          <option value="createdAt">
            {t('وقت الحركة', 'Date du mouvement')}
          </option>
          <option value="delta">
            {t('تغيير الكمية', 'Variation de quantité')}
          </option>
          <option value="balanceAfter">
            {t('الرصيد بعد الحركة', 'Stock après mouvement')}
          </option>
        </Select>
        <Select
          aria-label={t('اتجاه ترتيب الحركات', 'Sens du tri des mouvements')}
          value={sortOrder}
          onChange={(event) => {
            setSortOrder(event.target.value as 'asc' | 'desc');
            setPage(1);
          }}
        >
          <option value="desc">{t('تنازلي', 'Décroissant')}</option>
          <option value="asc">{t('تصاعدي', 'Croissant')}</option>
        </Select>
      </div>
      {query.isLoading ? (
        <div role="status" className="flex justify-center gap-2 py-12">
          <Spinner />
          {t('جار تحميل الحركات…', 'Chargement des mouvements…')}
        </div>
      ) : query.isError ? (
        <div role="alert" className="space-y-3 py-8 text-center">
          <p className="text-error">{getApiErrorMessage(query.error)}</p>
          <Button variant="secondary" onClick={() => void query.refetch()}>
            {t('إعادة المحاولة', 'Réessayer')}
          </Button>
        </div>
      ) : !query.data?.items.length ? (
        <p className="py-12 text-center text-on-surface-variant">
          {t(
            'لا توجد حركات مطابقة. يبدأ السجل بأول تغيير فعلي للمخزون.',
            'Aucun mouvement trouvé. L’historique commence au premier changement de quantité.',
          )}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-start text-sm">
            <thead>
              <tr className="border-b border-outline-variant text-xs text-on-surface-variant">
                {[
                  t('الوقت', 'Date'),
                  t('النوع', 'Type'),
                  t('التغيير', 'Variation'),
                  t('الرصيد بعد الحركة', 'Stock après mouvement'),
                  t('السبب', 'Motif'),
                  t('المنفذ', 'Auteur'),
                  t('الطلب', 'Commande'),
                ].map((label) => (
                  <th key={label} className="px-3 py-3 font-semibold">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {query.data.items.map((movement) => (
                <tr
                  key={movement.id}
                  className="border-b border-outline-variant/60 last:border-0"
                >
                  <td className="whitespace-nowrap px-3 py-4" dir="ltr">
                    {inventoryTime(movement.createdAt)}
                  </td>
                  <td className="px-3 py-4">
                    <Badge tone="neutral">
                      {movementLabels[movement.kind]}
                    </Badge>
                  </td>
                  <td
                    className={`px-3 py-4 font-semibold ${movement.delta > 0 ? 'text-tertiary' : 'text-error'}`}
                  >
                    <span dir="ltr">
                      {movement.delta > 0 ? '+' : ''}
                      {movement.delta}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <span dir="ltr">{movement.balanceAfter}</span>
                  </td>
                  <td className="max-w-xs whitespace-pre-wrap break-words px-3 py-4">
                    {movement.reason === 'Order confirmed'
                      ? t('تأكيد الطلب', 'Confirmation de commande')
                      : movement.reason === 'Order cancelled'
                        ? t('إلغاء الطلب', 'Annulation de commande')
                        : movement.reason}
                  </td>
                  <td className="max-w-44 break-all px-3 py-4 text-xs">
                    {movement.actorId ? (
                      <span dir="ltr">{movement.actorId}</span>
                    ) : (
                      t('النظام', 'Système')
                    )}
                  </td>
                  <td className="max-w-44 break-all px-3 py-4 text-xs">
                    {movement.orderId ? (
                      hasPermission('order:read') ? (
                        <Link
                          className="text-primary underline underline-offset-4"
                          href={`/orders/${movement.orderId}`}
                          dir="ltr"
                        >
                          {movement.orderId}
                        </Link>
                      ) : (
                        <span dir="ltr">{movement.orderId}</span>
                      )
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {query.data && !query.isError && (
        <Pagination meta={query.data.meta} onPageChange={setPage} />
      )}
    </Modal>
  );
}
