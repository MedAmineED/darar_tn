'use client';

import { useState } from 'react';
import { Gift, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Pagination } from '@/components/ui/pagination';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/common/empty-state';
import { FilterToolbar } from '@/components/common/filter-toolbar';
import { StatusBadge } from '@/components/products/status-badge';
import { PackFormModal } from '@/components/packs/pack-form-modal';
import { useLocale } from '@/contexts/locale-context';
import { getApiErrorMessage } from '@/lib/api/client';
import type { ProductStatus } from '@/lib/api/catalog-types';
import type { Pack } from '@/lib/api/packs';
import { useDeletePack, usePacks } from '@/hooks/use-packs';
import { useAuth } from '@/providers/auth-provider';
import { assetUrl, formatPrice } from '@/lib/utils';

export default function PacksPage() {
  const { t, strings, locale } = useLocale();
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ProductStatus | ''>('');
  const [editing, setEditing] = useState<Pack | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Pack | null>(null);
  const { data, isLoading } = usePacks({
    page,
    limit: 10,
    search: search || undefined,
    status: status || undefined,
  });
  const remove = useDeletePack();
  const items = data?.items ?? [];

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      const result = await remove.mutateAsync(toDelete.id);
      toast.success(
        result.archived
          ? t(
              'الباقة مستعملة في طلبات، فتمّت أرشفتها.',
              'Pack déjà commandé : archivé.',
            )
          : strings.common.deleted,
      );
      setToDelete(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div>
      <PageHeader
        title={t('عروض الباقات', 'Offres packs')}
        description={t(
          'مجموعة قطع تُباع معاً بسعر خاص. يُوزَّع سعر الباقة على منتجاتها في الطلب، فيبقى المخزون والأرباح صحيحة.',
          'Un ensemble de pièces vendu à prix spécial. Le prix est réparti sur les produits de la commande : stock et bénéfices restent justes.',
        )}
        action={
          hasPermission('pack:create') && (
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {t('باقة جديدة', 'Nouveau pack')}
            </Button>
          )
        }
      />
      <FilterToolbar
        resultLabel={
          data ? `${data.meta.total} ${t('باقة', 'packs')}` : undefined
        }
        search={
          <Input
            aria-label={strings.common.search}
            placeholder={t('ابحث باسم الباقة…', 'Rechercher un pack…')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        }
      >
        <Select
          aria-label={t('الحالة', 'Statut')}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as ProductStatus | '');
            setPage(1);
          }}
        >
          <option value="">{strings.catalog.products.allStatuses}</option>
          {(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'] as const).map((s) => (
            <option key={s} value={s}>
              {strings.catalog.status[s]}
            </option>
          ))}
        </Select>
      </FilterToolbar>
      <Card>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Gift}
            message={t('لا توجد باقات بعد', 'Aucun pack pour le moment')}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-[13px]">
              <thead>
                <tr className="border-b border-outline-variant text-start text-xs text-on-surface-variant">
                  <th className="px-4 py-3 text-start font-semibold">
                    {t('الباقة', 'Pack')}
                  </th>
                  <th className="px-4 py-3 text-start font-semibold">
                    {t('المحتوى', 'Contenu')}
                  </th>
                  <th className="px-4 py-3 text-start font-semibold">
                    {t('السعر', 'Prix')}
                  </th>
                  <th className="px-4 py-3 text-start font-semibold">
                    {t('الربح / الوحدة', 'Marge / unité')}
                  </th>
                  <th className="px-4 py-3 text-start font-semibold">
                    {t('الحالة', 'Statut')}
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map((pack) => {
                  const image = assetUrl(pack.image);
                  const margin =
                    pack.cost === null ? null : pack.price - pack.cost;
                  return (
                    <tr
                      key={pack.id}
                      className="border-b border-outline-variant/60 last:border-0"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={image}
                              alt=""
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            <div className="grid h-10 w-10 place-items-center rounded bg-surface-container">
                              <Gift className="h-4 w-4 text-on-surface-variant" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-on-surface">
                              {locale === 'ar' ? pack.nameAr : pack.nameFr}
                            </p>
                            <p className="text-xs text-on-surface-variant">
                              {locale === 'ar' ? pack.nameFr : pack.nameAr}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">
                        {pack.items
                          .map(
                            (i) =>
                              `${i.quantity}× ${locale === 'ar' ? i.nameAr : i.nameFr}`,
                          )
                          .join('، ')}
                      </td>
                      <td className="px-4 py-3" dir="ltr">
                        <span className="font-semibold">
                          {formatPrice(pack.price)}
                        </span>
                        {pack.discountPercentage != null && (
                          <span className="ms-2 text-xs text-on-surface-variant line-through">
                            {formatPrice(pack.regularPrice)}
                          </span>
                        )}
                        {pack.discountPercentage != null && (
                          <span className="ms-1 text-xs font-semibold text-tertiary">
                            -{pack.discountPercentage}%
                          </span>
                        )}
                      </td>
                      <td
                        className={`px-4 py-3 ${margin !== null && margin < 0 ? 'text-error' : ''}`}
                        dir="ltr"
                      >
                        {margin === null ? (
                          <span className="text-xs text-amber-700">
                            {t('تكلفة ناقصة', 'coût manquant')}
                          </span>
                        ) : (
                          formatPrice(margin)
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={pack.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {hasPermission('pack:update') && (
                            <button
                              className="rounded p-1.5 text-on-surface-variant hover:bg-surface-container"
                              aria-label={strings.common.edit}
                              onClick={() => {
                                setEditing(pack);
                                setFormOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                          {hasPermission('pack:delete') && (
                            <button
                              className="rounded p-1.5 text-error hover:bg-error-container/40"
                              aria-label={strings.common.delete}
                              onClick={() => setToDelete(pack)}
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
      <PackFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        pack={editing}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title={strings.common.confirmDelete}
        message={t(
          'حذف هذه الباقة؟ إن كانت مستعملة في طلبات ستُؤرشف فقط.',
          'Supprimer ce pack ? S’il a déjà été commandé, il sera archivé.',
        )}
        isLoading={remove.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
