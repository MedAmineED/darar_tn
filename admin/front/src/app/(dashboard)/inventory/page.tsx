'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  History,
  Package,
  PackagePlus,
  Plus,
  Pencil,
  SlidersHorizontal,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/common/empty-state';
import { FilterToolbar } from '@/components/common/filter-toolbar';
import { StatusBadge } from '@/components/products/status-badge';
import {
  AvailabilityBadge,
  useInventoryLabels,
  inventoryTime,
} from '@/components/inventory/inventory-badges';
import { AnimatePresence } from 'motion/react';
import { StockFormModal } from '@/components/inventory/stock-form-modal';
import { MovementHistory } from '@/components/inventory/movement-history';
import { ReceiveStockModal } from '@/components/inventory/receive-stock-modal';
import { useInventory } from '@/hooks/use-inventory';
import { useAuth } from '@/providers/auth-provider';
import { listCategories } from '@/lib/api/categories';
import { getApiErrorMessage } from '@/lib/api/client';
import type { ProductStatus } from '@/lib/api/catalog-types';
import type { InventoryItem, InventorySort } from '@/lib/api/inventory';
import { useLocale } from '@/contexts/locale-context';

const statuses: ProductStatus[] = ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'];
function LoadingInventory() {
  const { t } = useLocale();
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-16">
      <Spinner className="h-6 w-6" />
      {t('جار تحميل المخزون…', 'Chargement du stock…')}
    </div>
  );
}

function InventoryContent() {
  const { t, locale, strings } = useLocale();
  const { availabilityLabels } = useInventoryLabels();
  const { hasPermission } = useAuth();
  const canRead = hasPermission('inventory:read');
  const canAdjust = hasPermission('inventory:adjust');
  const canReadCategories = hasPermission('category:read');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const rawAvailability = searchParams.get('availability');
  const availability =
    rawAvailability === 'IN' ||
    rawAvailability === 'LOW' ||
    rawAvailability === 'OUT'
      ? rawAvailability
      : '';
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const urlSearch = searchParams.get('search') ?? '';
  const [search, setSearch] = useState(urlSearch);
  useEffect(() => {
    setSearch(urlSearch);
    setPage(1);
  }, [urlSearch]);
  const [status, setStatus] = useState<ProductStatus | ''>('');
  const [categoryId, setCategoryId] = useState('');
  const [categoryLabel, setCategoryLabel] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [sortBy, setSortBy] = useState<InventorySort>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [form, setForm] = useState<{
    item: InventoryItem;
    mode: 'adjustment' | 'threshold' | 'receipt';
  } | null>(null);
  const [history, setHistory] = useState<InventoryItem | null>(null);
  const [receiving, setReceiving] = useState(false);
  useEffect(() => setPage(1), [availability]);
  const query = useInventory({
    page,
    limit,
    search: search.trim() || undefined,
    status: status || undefined,
    categoryId: categoryId || undefined,
    availability: availability || undefined,
    sortBy,
    sortOrder,
  });
  const categories = useQuery({
    queryKey: ['categories', 'inventory-filter', categorySearch],
    queryFn: () =>
      listCategories({
        page: 1,
        limit: 100,
        search: categorySearch.trim() || undefined,
      }),
    enabled: canRead && canReadCategories,
  });
  const setAvailability = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set('availability', value);
    else params.delete('availability');
    setPage(1);
    router.replace(`${pathname}${params.size ? `?${params.toString()}` : ''}`, {
      scroll: false,
    });
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setCategoryId('');
    setCategoryLabel('');
    setCategorySearch('');
    setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('search');
    params.delete('availability');
    router.replace(`${pathname}${params.size ? `?${params.toString()}` : ''}`, {
      scroll: false,
    });
  };

  if (!canRead)
    return (
      <div>
        <PageHeader title={t('المخزون', 'Stock')} />
        <Card className="p-8 text-center text-on-surface-variant">
          {t(
            'ليس لديك صلاحية لعرض المخزون.',
            'Vous n’avez pas accès au stock.',
          )}
        </Card>
      </div>
    );

  return (
    <div>
      <PageHeader
        title={t('المخزون', 'Stock')}
        description={t(
          'الأرصدة والاستلامات وسجل الحركات.',
          'Quantités, réceptions et historique des mouvements.',
        )}
        action={
          <div className="flex flex-wrap gap-2">
            {hasPermission('product:create') && (
              <Link
                href="/products/create?returnTo=inventory"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant/70 bg-surface-lowest px-3 py-2 text-xs font-medium hover:bg-surface-container focus-visible:outline-primary"
              >
                <Plus className="h-4 w-4" />
                {t('منتج جديد', 'Nouveau produit')}
              </Link>
            )}
            {canAdjust && (
              <Button onClick={() => setReceiving(true)}>
                <PackagePlus className="h-4 w-4" />
                {t('استلام مخزون', 'Réceptionner du stock')}
              </Button>
            )}
          </div>
        }
      />
      <FilterToolbar
        resultLabel={
          query.data
            ? `${query.data.meta.total} ${t('منتج', 'produits')}`
            : undefined
        }
        chips={[
          ...(availability
            ? [
                {
                  label: availabilityLabels[availability],
                  onRemove: () => setAvailability(''),
                },
              ]
            : []),
          ...(status
            ? [
                {
                  label: strings.catalog.status[status],
                  onRemove: () => {
                    setStatus('');
                    setPage(1);
                  },
                },
              ]
            : []),
          ...(categoryId
            ? [
                {
                  label:
                    categoryLabel || t('فئة محددة', 'Catégorie sélectionnée'),
                  onRemove: () => {
                    setCategoryId('');
                    setCategoryLabel('');
                    setPage(1);
                  },
                },
              ]
            : []),
        ]}
        onClear={clearFilters}
        search={
          <Input
            aria-label={t('بحث في المخزون', 'Rechercher dans le stock')}
            value={search}
            placeholder={t(
              'بحث بالاسم العربي أو الفرنسي أو SKU',
              'Nom arabe, français ou référence SKU',
            )}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        }
      >
        <Select
          aria-label={t('توفر المخزون', 'Disponibilité du stock')}
          value={availability}
          onChange={(event) => setAvailability(event.target.value)}
        >
          <option value="">
            {t('كل حالات التوفر', 'Toutes les disponibilités')}
          </option>
          {Object.entries(availabilityLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          aria-label={t('حالة نشر المنتج', 'Publication du produit')}
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as ProductStatus | '');
            setPage(1);
          }}
        >
          <option value="">
            {t('كل حالات النشر', 'Toutes les publications')}
          </option>
          {statuses.map((value) => (
            <option key={value} value={value}>
              {strings.catalog.status[value]}
            </option>
          ))}
        </Select>
        <Select
          aria-label={t('عدد المنتجات في الصفحة', 'Produits par page')}
          value={limit}
          onChange={(event) => {
            setLimit(Number(event.target.value));
            setPage(1);
          }}
        >
          {[10, 20, 50, 100].map((value) => (
            <option key={value} value={value}>
              {value} {t('منتج في الصفحة', 'produits par page')}
            </option>
          ))}
        </Select>
        {canReadCategories && (
          <>
            <Input
              aria-label={t('بحث عن فئة', 'Rechercher une catégorie')}
              value={categorySearch}
              placeholder={t('بحث عن فئة', 'Rechercher une catégorie')}
              onChange={(event) => setCategorySearch(event.target.value)}
            />
            <Select
              aria-label={t('فئة المنتج', 'Catégorie du produit')}
              value={categoryId}
              onChange={(event) => {
                setCategoryId(event.target.value);
                setCategoryLabel(
                  categories.data?.items.find(
                    (category) => category.id === event.target.value,
                  )?.[locale === 'fr' ? 'nameFr' : 'nameAr'] ?? '',
                );
                setPage(1);
              }}
              disabled={categories.isLoading || categories.isError}
            >
              <option value="">
                {t('كل الفئات', 'Toutes les catégories')}
              </option>
              {categoryId &&
                !categories.data?.items.some(
                  (category) => category.id === categoryId,
                ) && <option value={categoryId}>{categoryLabel}</option>}
              {(categories.data?.items ?? []).map((category) => (
                <option key={category.id} value={category.id}>
                  {locale === 'fr' ? category.nameFr : category.nameAr}
                </option>
              ))}
            </Select>
          </>
        )}
        <Select
          aria-label={t('ترتيب المخزون حسب', 'Trier le stock par')}
          value={sortBy}
          onChange={(event) => {
            setSortBy(event.target.value as InventorySort);
            setPage(1);
          }}
        >
          <option value="updatedAt">
            {t('آخر تحديث', 'Dernière mise à jour')}
          </option>
          <option value="quantity">{t('الكمية', 'Quantité')}</option>
          <option value="lowStockThreshold">
            {t('حد التنبيه', 'Seuil d’alerte')}
          </option>
          <option value="nameAr">{t('الاسم العربي', 'Nom arabe')}</option>
          <option value="nameFr">{t('الاسم الفرنسي', 'Nom français')}</option>
        </Select>
        <Select
          aria-label={t('اتجاه ترتيب المخزون', 'Sens du tri du stock')}
          value={sortOrder}
          onChange={(event) => {
            setSortOrder(event.target.value as 'asc' | 'desc');
            setPage(1);
          }}
        >
          <option value="desc">{t('تنازلي', 'Décroissant')}</option>
          <option value="asc">{t('تصاعدي', 'Croissant')}</option>
        </Select>
        {categories.isError && (
          <div
            role="alert"
            className="col-span-full flex flex-wrap items-center gap-2 text-xs text-error"
          >
            {t('تعذر تحميل الفئات.', 'Impossible de charger les catégories.')}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void categories.refetch()}
            >
              {t('إعادة المحاولة', 'Réessayer')}
            </Button>
          </div>
        )}
        {categories.data && categories.data.meta.total > 100 && (
          <p className="col-span-full text-xs text-on-surface-variant">
            {t(
              'تُعرض أول 100 فئة مطابقة. استخدم بحث الفئة لتضييق النتائج.',
              'Les 100 premières catégories sont affichées. Affinez votre recherche.',
            )}
          </p>
        )}
      </FilterToolbar>
      <Card>
        {query.isLoading ? (
          <LoadingInventory />
        ) : query.isError ? (
          <div role="alert" className="space-y-3 p-8 text-center">
            <p className="text-error">{getApiErrorMessage(query.error)}</p>
            <Button variant="secondary" onClick={() => void query.refetch()}>
              {t('إعادة المحاولة', 'Réessayer')}
            </Button>
          </div>
        ) : !query.data?.items.length ? (
          <div>
            <EmptyState
              icon={Package}
              message={t(
                'لا توجد منتجات مطابقة لفلاتر المخزون.',
                'Aucun produit ne correspond aux filtres.',
              )}
            />
            <div className="mb-6 flex justify-center gap-2">
              <Button variant="secondary" onClick={clearFilters}>
                {t('مسح الفلاتر', 'Effacer les filtres')}
              </Button>
              <Button variant="ghost" onClick={() => void query.refetch()}>
                {t('تحديث المخزون', 'Actualiser le stock')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-start text-sm">
              <thead>
                <tr className="border-b border-outline-variant text-xs text-on-surface-variant">
                  {[
                    t('المنتج', 'Produit'),
                    t('الرصيد', 'En stock'),
                    t('حد التنبيه', 'Seuil d’alerte'),
                    t('التوفر', 'Disponibilité'),
                    t('حالة النشر', 'Publication'),
                    t('آخر تحديث (تونس)', 'Mise à jour (Tunis)'),
                    t('الإجراءات', 'Actions'),
                  ].map((label) => (
                    <th key={label} className="px-4 py-3 font-semibold">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {query.data.items.map((item) => (
                  <tr
                    key={item.productId}
                    className="border-b border-outline-variant/60 last:border-0 hover:bg-surface-container/40"
                  >
                    <td className="max-w-64 px-4 py-4">
                      <p className="font-medium">
                        {locale === 'fr'
                          ? item.product.nameFr
                          : item.product.nameAr}
                      </p>
                      <p
                        dir={locale === 'fr' ? 'rtl' : 'ltr'}
                        className="mt-1 text-start text-xs text-on-surface-variant"
                      >
                        {locale === 'fr'
                          ? item.product.nameAr
                          : item.product.nameFr}
                      </p>
                      <p
                        dir="ltr"
                        className="mt-1 text-start text-xs text-on-surface-variant"
                      >
                        {item.product.sku ?? '—'}
                      </p>
                    </td>
                    <td className="px-4 py-4 font-semibold">
                      <span dir="ltr">{item.quantity}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span dir="ltr">{item.lowStockThreshold}</span>
                    </td>
                    <td className="px-4 py-4">
                      <AvailabilityBadge availability={item.availability} />
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={item.product.status} />
                    </td>
                    <td
                      className="whitespace-nowrap px-4 py-4 text-xs"
                      dir="ltr"
                    >
                      {inventoryTime(item.updatedAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setHistory(item)}
                          aria-label={`${t('سجل الحركات', 'Historique')}: ${locale === 'fr' ? item.product.nameFr : item.product.nameAr}`}
                        >
                          <History className="h-4 w-4" />
                          <span>{t('السجل', 'Historique')}</span>
                        </Button>
                        {canAdjust && (
                          <>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setForm({ item, mode: 'receipt' })}
                              aria-label={`${t('استلام مخزون', 'Réceptionner du stock')}: ${locale === 'fr' ? item.product.nameFr : item.product.nameAr}`}
                            >
                              <PackagePlus className="h-4 w-4" />
                              {t('استلام', 'Réceptionner')}
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                setForm({ item, mode: 'adjustment' })
                              }
                              aria-label={`${t('تعديل الكمية', 'Ajuster la quantité')}: ${locale === 'fr' ? item.product.nameFr : item.product.nameAr}`}
                            >
                              <Pencil className="h-4 w-4" />
                              <span>{t('تعديل', 'Ajuster')}</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setForm({ item, mode: 'threshold' })
                              }
                              aria-label={`${t('حد التنبيه', 'Seuil d’alerte')}: ${locale === 'fr' ? item.product.nameFr : item.product.nameAr}`}
                            >
                              <SlidersHorizontal className="h-4 w-4" />
                              <span>{t('حد التنبيه', 'Seuil d’alerte')}</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {query.data && !query.isError && (
          <div className="px-4">
            <Pagination meta={query.data.meta} onPageChange={setPage} />
          </div>
        )}
      </Card>
      <AnimatePresence>
        {form && canAdjust && (
          <StockFormModal
            key={`${form.item.productId}-${form.mode}`}
            item={form.item}
            mode={form.mode}
            onClose={() => setForm(null)}
          />
        )}
        {history && (
          <MovementHistory
            key={`history-${history.productId}`}
            item={history}
            onClose={() => setHistory(null)}
          />
        )}
        {receiving && canAdjust && (
          <ReceiveStockModal
            key="receive-stock"
            onClose={() => setReceiving(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<LoadingInventory />}>
      <InventoryContent />
    </Suspense>
  );
}
