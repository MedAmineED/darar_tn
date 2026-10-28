'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ImageOff, Package, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Toggle } from '@/components/ui/toggle';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/common/empty-state';
import { FilterToolbar, FilterField } from '@/components/common/filter-toolbar';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { StatusBadge } from '@/components/products/status-badge';
import { useLocale } from '@/contexts/locale-context';
import { assetUrl, formatPrice } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/api/client';
import type { Product, ProductStatus } from '@/lib/api/catalog-types';
import {
  useProducts,
  useDeleteProduct,
  useUpdateProduct,
} from '@/hooks/use-products';
import { useCategories } from '@/hooks/use-categories';
import { useAuth } from '@/providers/auth-provider';

const STATUSES: ProductStatus[] = ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'];

export default function ProductsPage() {
  const { strings, locale, t } = useLocale();
  const p = strings.catalog.products;
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('product:create');
  const canWrite = hasPermission('product:update');
  const canDelete = hasPermission('product:delete');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ProductStatus | ''>('');
  const [categoryId, setCategoryId] = useState('');
  const [sort, setSort] = useState('createdAt:desc');
  const [toDelete, setToDelete] = useState<Product | null>(null);

  const { data, isLoading, isError, error, refetch } = useProducts({
    page,
    limit: 10,
    search: search || undefined,
    status: status || undefined,
    categoryId: categoryId || undefined,
    sortBy: sort.startsWith('name:')
      ? locale === 'ar'
        ? 'nameAr'
        : 'nameFr'
      : sort.split(':')[0],
    sortOrder: sort.endsWith(':asc') ? 'asc' : 'desc',
  });
  const { data: cats } = useCategories({ limit: 100 });
  const remove = useDeleteProduct();
  const update = useUpdateProduct();
  const [toggling, setToggling] = useState<string | null>(null);

  const resetPage = () => setPage(1);

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove.mutateAsync(toDelete.id);
      toast.success(strings.common.deleted);
      setToDelete(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  // One-click publish/unpublish from the list: ACTIVE shows the product on
  // the storefront, INACTIVE hides it.
  const toggleActive = async (product: Product, active: boolean) => {
    setToggling(product.id);
    try {
      await update.mutateAsync({
        id: product.id,
        input: { status: active ? 'ACTIVE' : 'INACTIVE' },
      });
      toast.success(strings.common.saved);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setToggling(null);
    }
  };

  const items = data?.items ?? [];

  return (
    <div>
      <PageHeader
        title={p.title}
        action={
          <div className="flex gap-2">
            {canWrite && (
              <Button
                variant="secondary"
                onClick={() => router.push('/products/featured')}
              >
                <Star className="h-4 w-4" />
                {t('منتجات الصفحة الرئيسية', 'Produits de l’accueil')}
              </Button>
            )}
            {canCreate && (
              <Button onClick={() => router.push('/products/create')}>
                <Plus className="h-4 w-4" />
                {p.add}
              </Button>
            )}
          </div>
        }
      />

      <FilterToolbar
        resultLabel={
          data ? `${data.meta.total} ${t('منتج', 'produits')}` : undefined
        }
        onClear={() => {
          setStatus('');
          setCategoryId('');
          setPage(1);
        }}
        chips={[
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
                    cats?.items.find((cat) => cat.id === categoryId)?.[
                      locale === 'ar' ? 'nameAr' : 'nameFr'
                    ] ?? p.category,
                  onRemove: () => {
                    setCategoryId('');
                    setPage(1);
                  },
                },
              ]
            : []),
        ]}
        search={
          <Input
            aria-label={p.searchPlaceholder}
            placeholder={p.searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
          />
        }
      >
        <FilterField label={p.status}>
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as ProductStatus | '');
              resetPage();
            }}
          >
            <option value="">{p.allStatuses}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {strings.catalog.status[s]}
              </option>
            ))}
          </Select>
        </FilterField>
        <FilterField label={p.category}>
          <Select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              resetPage();
            }}
          >
            <option value="">{p.allCategories}</option>
            {(cats?.items ?? []).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {locale === 'ar' ? cat.nameAr : cat.nameFr}
              </option>
            ))}
          </Select>
        </FilterField>
        <FilterField label={t('ترتيب حسب', 'Trier par')}>
          <Select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
          >
            <option value="createdAt:desc">
              {t('الأحدث أولاً', 'Plus récents')}
            </option>
            <option value="price:asc">
              {t('السعر تصاعديًا', 'Prix croissant')}
            </option>
            <option value="price:desc">
              {t('السعر تنازليًا', 'Prix décroissant')}
            </option>
            <option value="name:asc">{t('الاسم', 'Nom')}</option>
          </Select>
        </FilterField>
      </FilterToolbar>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : isError ? (
          <div role="alert" className="space-y-3 p-8 text-center text-sm">
            <p>{getApiErrorMessage(error)}</p>
            <Button variant="secondary" onClick={() => void refetch()}>
              {t('إعادة المحاولة', 'Réessayer')}
            </Button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={Package} message={p.empty} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-[13px]">
              <thead>
                <tr className="border-b border-outline-variant/60 bg-surface-low/70 text-start text-[11px] text-on-surface-variant">
                  <th className="px-4 py-3 font-semibold">{p.product}</th>
                  <th className="px-4 py-3 font-semibold">{p.category}</th>
                  <th className="px-4 py-3 font-semibold">{p.price}</th>
                  <th className="px-4 py-3 font-semibold">{p.status}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map((product) => {
                  const primary =
                    product.images.find((i) => i.isPrimary) ??
                    product.images[0];
                  return (
                    <tr
                      key={product.id}
                      className="border-b border-outline-variant/60 last:border-0 hover:bg-surface-container/40"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-container">
                            {primary ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={assetUrl(primary.url) ?? ''}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ImageOff className="h-4 w-4 text-on-surface-variant" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p
                              className="truncate font-medium text-on-surface"
                              dir={locale === 'ar' ? 'rtl' : 'ltr'}
                            >
                              {locale === 'ar'
                                ? product.nameAr
                                : product.nameFr}
                            </p>
                            <p
                              className="truncate text-xs text-on-surface-variant"
                              dir={locale === 'ar' ? 'ltr' : 'rtl'}
                            >
                              {locale === 'ar'
                                ? product.nameFr
                                : product.nameAr}
                              {product.isFeatured && ' ★'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">
                        {product.category
                          ? locale === 'ar'
                            ? product.category.nameAr
                            : product.category.nameFr
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2" dir="ltr">
                          <span className="font-medium text-on-surface">
                            {formatPrice(product.price)}
                          </span>
                          {product.oldPrice && (
                            <span className="text-xs text-on-surface-variant line-through">
                              {formatPrice(product.oldPrice)}
                            </span>
                          )}
                          {product.discountPercentage && (
                            <Badge tone="danger">
                              -{product.discountPercentage}%
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {canWrite && (
                            <Toggle
                              checked={product.status === 'ACTIVE'}
                              disabled={toggling === product.id}
                              onChange={(v) => toggleActive(product, v)}
                            />
                          )}
                          <StatusBadge status={product.status} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {canWrite && (
                            <Link
                              href={`/products/${product.id}/edit`}
                              className="rounded p-1.5 text-on-surface-variant hover:bg-surface-container"
                              aria-label={strings.common.edit}
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setToDelete(product)}
                              className="rounded p-1.5 text-error hover:bg-error-container/40"
                              aria-label={strings.common.delete}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {data && <Pagination meta={data.meta} onPageChange={setPage} />}
      </Card>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={strings.common.confirmDelete}
        message={p.deleteMessage}
        isLoading={remove.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
