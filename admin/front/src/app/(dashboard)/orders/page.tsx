'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, ShoppingCart } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/common/empty-state';
import { FilterToolbar, FilterField } from '@/components/common/filter-toolbar';
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from '@/components/orders/order-badges';
import { useLocale } from '@/contexts/locale-context';
import { formatDate, formatPrice } from '@/lib/utils';
import type { OrderStatus, PaymentStatus } from '@/lib/api/commerce-types';
import { useOrders } from '@/hooks/use-orders';
import { useAuth } from '@/providers/auth-provider';

const ORDER_STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];
const PAYMENT_STATUSES: PaymentStatus[] = [
  'PENDING',
  'PAID',
  'FAILED',
  'REFUNDED',
];

export default function OrdersPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <OrdersContent />
    </Suspense>
  );
}

function OrdersContent() {
  const { strings, t } = useLocale();
  const query = useSearchParams();
  const o = strings.commerce.orders;
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('order:create');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | ''>('');
  const changeFilter = (field: 'status' | 'paymentStatus', value: string) => {
    const params = new URLSearchParams(query.toString());
    if (value) params.set(field, value);
    else params.delete(field);
    router.replace(`/orders${params.size ? `?${params.toString()}` : ''}`, {
      scroll: false,
    });
    setPage(1);
  };

  const { data, isLoading } = useOrders({
    page,
    limit: 10,
    search: search || undefined,
    status: status || undefined,
    paymentStatus: paymentStatus || undefined,
  });
  useEffect(() => {
    const orderStatus = query.get('status');
    const payment = query.get('paymentStatus');
    setStatus(ORDER_STATUSES.find((value) => value === orderStatus) ?? '');
    setPaymentStatus(PAYMENT_STATUSES.find((value) => value === payment) ?? '');
    setPage(1);
  }, [query]);
  const items = data?.items ?? [];

  return (
    <div>
      <PageHeader
        title={o.title}
        action={
          canCreate && (
            <Button onClick={() => router.push('/orders/create')}>
              <Plus className="h-4 w-4" />
              {o.create}
            </Button>
          )
        }
      />

      <FilterToolbar
        resultLabel={
          data ? `${data.meta.total} ${t('طلب', 'commandes')}` : undefined
        }
        chips={[
          ...(status
            ? [
                {
                  label: strings.commerce.orderStatus[status],
                  onRemove: () => {
                    setStatus('');
                    changeFilter('status', '');
                    setPage(1);
                  },
                },
              ]
            : []),
          ...(paymentStatus
            ? [
                {
                  label: `${o.paymentStatus} : ${strings.commerce.paymentStatus[paymentStatus]}`,
                  onRemove: () => {
                    setPaymentStatus('');
                    changeFilter('paymentStatus', '');
                    setPage(1);
                  },
                },
              ]
            : []),
        ]}
        onClear={() => {
          setStatus('');
          setPaymentStatus('');
          const params = new URLSearchParams(query.toString());
          params.delete('status');
          params.delete('paymentStatus');
          router.replace(
            `/orders${params.size ? `?${params.toString()}` : ''}`,
            { scroll: false },
          );
          setPage(1);
        }}
        search={
          <Input
            aria-label={o.searchPlaceholder}
            placeholder={o.searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        }
      >
        <FilterField label={o.status}>
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as OrderStatus | '');
              changeFilter('status', e.target.value);
              setPage(1);
            }}
          >
            <option value="">{o.allStatuses}</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {strings.commerce.orderStatus[s]}
              </option>
            ))}
          </Select>
        </FilterField>
        <FilterField label={o.paymentStatus}>
          <Select
            value={paymentStatus}
            onChange={(e) => {
              setPaymentStatus(e.target.value as PaymentStatus | '');
              changeFilter('paymentStatus', e.target.value);
              setPage(1);
            }}
          >
            <option value="">{o.allPayments}</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {strings.commerce.paymentStatus[s]}
              </option>
            ))}
          </Select>
        </FilterField>
      </FilterToolbar>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={ShoppingCart} message={o.empty} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-[13px]">
              <thead>
                <tr className="border-b border-outline-variant text-start text-xs uppercase tracking-wide text-on-surface-variant">
                  <th className="px-4 py-3 font-semibold">{o.orderNumber}</th>
                  <th className="px-4 py-3 font-semibold">{o.customer}</th>
                  <th className="px-4 py-3 font-semibold">{o.date}</th>
                  <th className="px-4 py-3 font-semibold">{o.total}</th>
                  <th className="px-4 py-3 font-semibold">{o.status}</th>
                  <th className="px-4 py-3 font-semibold">{o.paymentStatus}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((order) => (
                  <tr
                    key={order.id}
                    className="cursor-pointer border-b border-outline-variant/60 last:border-0 hover:bg-surface-container/40"
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    <td
                      className="px-4 py-3 font-medium text-on-surface"
                      dir="ltr"
                    >
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3 text-on-surface">
                      {order.customerName}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant" dir="ltr">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-medium" dir="ltr">
                      {formatPrice(order.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && <Pagination meta={data.meta} onPageChange={setPage} />}
      </Card>
    </div>
  );
}
