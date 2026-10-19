'use client';

import { useMemo, useState } from 'react';
import { FolderTree, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/common/empty-state';
import { FilterToolbar } from '@/components/common/filter-toolbar';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { CategoryFormModal } from '@/components/categories/category-form-modal';
import { useLocale } from '@/contexts/locale-context';
import { getApiErrorMessage } from '@/lib/api/client';
import type { Category } from '@/lib/api/catalog-types';
import { useCategories, useDeleteCategory } from '@/hooks/use-categories';
import { useAuth } from '@/providers/auth-provider';

export default function CategoriesPage() {
  const { strings, locale, t } = useLocale();
  const c = strings.catalog.categories;
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('category:update');

  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Category | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Category | null>(null);

  const { data, isLoading } = useCategories({ limit: 100, search });
  const remove = useDeleteCategory();
  const items = useMemo(() => data?.items ?? [], [data]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (category: Category) => {
    setEditing(category);
    setFormOpen(true);
  };

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

  return (
    <div>
      <PageHeader
        title={c.title}
        action={
          canWrite && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {c.add}
            </Button>
          )
        }
      />

      <FilterToolbar
        resultLabel={
          data ? `${data.meta.total} ${t('فئة', 'catégories')}` : undefined
        }
        search={
          <Input
            aria-label={strings.common.search}
            placeholder={strings.common.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        }
      />

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={FolderTree} message={c.empty} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-[13px]">
              <thead>
                <tr className="border-b border-outline-variant text-start text-xs uppercase tracking-wide text-on-surface-variant">
                  <th className="px-4 py-3 font-semibold">{c.nameAr}</th>
                  <th className="px-4 py-3 font-semibold">{c.nameFr}</th>
                  <th className="px-4 py-3 font-semibold">{c.parent}</th>
                  <th className="px-4 py-3 font-semibold">{c.products}</th>
                  <th className="px-4 py-3 font-semibold">
                    {strings.common.active}
                  </th>
                  {canWrite && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody>
                {items.map((cat) => (
                  <tr
                    key={cat.id}
                    className="border-b border-outline-variant/60 last:border-0 hover:bg-surface-container/40"
                  >
                    <td
                      className="px-4 py-3 font-medium text-on-surface"
                      dir="rtl"
                    >
                      {cat.nameAr}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant" dir="ltr">
                      {cat.nameFr}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {cat.parent
                        ? locale === 'ar'
                          ? cat.parent.nameAr
                          : cat.parent.nameFr
                        : '—'}
                    </td>
                    <td className="px-4 py-3">{cat.productCount}</td>
                    <td className="px-4 py-3">
                      <Badge tone={cat.isActive ? 'success' : 'neutral'}>
                        {cat.isActive
                          ? strings.common.active
                          : strings.common.inactive}
                      </Badge>
                    </td>
                    {canWrite && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => openEdit(cat)}
                            className="rounded p-1.5 text-on-surface-variant hover:bg-surface-container"
                            aria-label={strings.common.edit}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setToDelete(cat)}
                            className="rounded p-1.5 text-error hover:bg-error-container/40"
                            aria-label={strings.common.delete}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <CategoryFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        category={editing}
        parentOptions={items}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={strings.common.confirmDelete}
        message={c.deleteMessage}
        isLoading={remove.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
