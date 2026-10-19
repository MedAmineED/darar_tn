'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/common/empty-state';
import { FilterToolbar } from '@/components/common/filter-toolbar';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { CustomerFormModal } from '@/components/customers/customer-form-modal';
import { useLocale } from '@/contexts/locale-context';
import { getApiErrorMessage } from '@/lib/api/client';
import type { Customer } from '@/lib/api/commerce-types';
import { useCustomers, useDeleteCustomer } from '@/hooks/use-customers';
import { useAuth } from '@/providers/auth-provider';

export default function CustomersPage() {
  const { strings, t } = useLocale();
  const c = strings.commerce.customers;
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('customer:create');
  const canWrite = hasPermission('customer:update');
  const canDelete = hasPermission('customer:delete');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Customer | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Customer | null>(null);

  const { data, isLoading } = useCustomers({
    page,
    limit: 10,
    search: search || undefined,
  });
  const remove = useDeleteCustomer();
  const items = data?.items ?? [];

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
          canCreate && (
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {c.add}
            </Button>
          )
        }
      />

      <FilterToolbar
        resultLabel={
          data ? `${data.meta.total} ${t('عميل', 'clients')}` : undefined
        }
        search={
          <Input
            aria-label={c.searchPlaceholder}
            placeholder={c.searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        }
      />

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={Users} message={c.empty} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-[13px]">
              <thead>
                <tr className="border-b border-outline-variant text-start text-xs uppercase tracking-wide text-on-surface-variant">
                  <th className="px-4 py-3 font-semibold">{c.firstName}</th>
                  <th className="px-4 py-3 font-semibold">{c.email}</th>
                  <th className="px-4 py-3 font-semibold">{c.phone}</th>
                  <th className="px-4 py-3 font-semibold">{c.orders}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map((customer) => (
                  <tr
                    key={customer.id}
                    className="cursor-pointer border-b border-outline-variant/60 last:border-0 hover:bg-surface-container/40"
                    onClick={() => router.push(`/customers/${customer.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-on-surface">
                      {customer.firstName} {customer.lastName}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant" dir="ltr">
                      {customer.email ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant" dir="ltr">
                      {customer.phone ?? '—'}
                    </td>
                    <td className="px-4 py-3">{customer.orderCount}</td>
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() =>
                            router.push(`/customers/${customer.id}`)
                          }
                          className="rounded p-1.5 text-on-surface-variant hover:bg-surface-container"
                          aria-label={c.detail}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {canWrite && (
                          <button
                            onClick={() => {
                              setEditing(customer);
                              setFormOpen(true);
                            }}
                            className="rounded p-1.5 text-on-surface-variant hover:bg-surface-container"
                            aria-label={strings.common.edit}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setToDelete(customer)}
                            className="rounded p-1.5 text-error hover:bg-error-container/40"
                            aria-label={strings.common.delete}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && <Pagination meta={data.meta} onPageChange={setPage} />}
      </Card>

      <CustomerFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        customer={editing}
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
