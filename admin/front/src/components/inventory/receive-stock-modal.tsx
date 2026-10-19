'use client';

import { useState } from 'react';
import { Search, PackagePlus, ArrowLeft } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Spinner } from '@/components/ui/spinner';
import { useInventory } from '@/hooks/use-inventory';
import { useLocale } from '@/contexts/locale-context';
import { getApiErrorMessage } from '@/lib/api/client';
import type { InventoryItem } from '@/lib/api/inventory';
import { StockFormModal } from './stock-form-modal';

/** Choose from server-side inventory results, then record a positive receipt. */
export function ReceiveStockModal({ onClose }: { onClose: () => void }) {
  const { t, locale } = useLocale();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const query = useInventory({
    page,
    limit: 5,
    search: search.trim() || undefined,
    sortBy: locale === 'fr' ? 'nameFr' : 'nameAr',
    sortOrder: 'asc',
  });

  if (selected)
    return <StockFormModal item={selected} mode="receipt" onClose={onClose} />;

  return (
    <Modal
      open
      onClose={onClose}
      title={t('استلام مخزون', 'Réceptionner du stock')}
    >
      <p className="mb-4 text-sm text-on-surface-variant">
        {t(
          'اختر المنتج الذي وصل، ثم سجّل الكمية وسبب الإضافة.',
          'Choisissez le produit reçu, puis renseignez la quantité et le motif.',
        )}
      </p>
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute start-3 top-3 h-4 w-4 text-on-surface-variant" />
        <Input
          autoFocus
          className="ps-9"
          value={search}
          aria-label={t(
            'ابحث عن منتج لاستلام مخزونه',
            'Rechercher un produit à réceptionner',
          )}
          placeholder={t(
            'اسم المنتج أو SKU',
            'Nom du produit ou référence SKU',
          )}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>
      {query.isLoading ? (
        <div role="status" className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : query.isError ? (
        <div role="alert" className="space-y-3 py-6 text-center">
          <p>{getApiErrorMessage(query.error)}</p>
          <Button onClick={() => void query.refetch()}>
            {t('إعادة المحاولة', 'Réessayer')}
          </Button>
        </div>
      ) : !query.data?.items.length ? (
        <div className="py-10 text-center text-sm text-on-surface-variant">
          {t(
            'لا يوجد منتج مطابق. يمكنك إنشاء منتج جديد من صفحة المخزون.',
            'Aucun produit trouvé. Vous pouvez créer un produit depuis la page Stock.',
          )}
        </div>
      ) : (
        <ul className="divide-y divide-outline-variant rounded-lg border border-outline-variant">
          {query.data.items.map((item) => (
            <li key={item.productId}>
              <button
                type="button"
                className="flex w-full items-center gap-3 p-4 text-start hover:bg-surface-low focus-visible:outline-primary"
                onClick={() => setSelected(item)}
              >
                <span className="rounded bg-primary/10 p-2 text-primary">
                  <PackagePlus className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {locale === 'fr'
                      ? item.product.nameFr
                      : item.product.nameAr}
                  </span>
                  <span className="mt-1 block text-xs text-on-surface-variant">
                    {item.product.sku || '—'} · {t('الرصيد', 'En stock')} :{' '}
                    {item.quantity}
                  </span>
                </span>
                <ArrowLeft className="h-4 w-4 ltr:rotate-180" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {query.data && (
        <Pagination meta={query.data.meta} onPageChange={setPage} />
      )}
    </Modal>
  );
}
