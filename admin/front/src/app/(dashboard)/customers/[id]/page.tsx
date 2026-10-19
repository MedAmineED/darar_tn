'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, Mail, Phone, ShoppingBag, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/common/empty-state';
import { Users } from 'lucide-react';
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from '@/components/orders/order-badges';
import { useLocale } from '@/contexts/locale-context';
import { formatDate, formatPrice } from '@/lib/utils';
import { useCustomer } from '@/hooks/use-customers';

export default function CustomerDetailPage() {
  const { strings } = useLocale();
  const c = strings.commerce.customers;
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { data: customer, isLoading, isError } = useCustomer(params.id);

  return (
    <div>
      <PageHeader
        title={c.detail}
        action={
          <Button variant="secondary" onClick={() => router.push('/customers')}>
            <ArrowRight className="h-4 w-4 ltr:rotate-180" />
            {strings.common.back}
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      ) : isError || !customer ? (
        <EmptyState icon={Users} message={strings.common.noResults} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-1">
              <CardContent className="space-y-3">
                <p className="font-heading text-lg font-semibold text-on-surface">
                  {customer.firstName} {customer.lastName}
                </p>
                <p
                  className="flex items-center gap-2 text-sm text-on-surface-variant"
                  dir="ltr"
                >
                  <Mail className="h-4 w-4" />
                  {customer.email ?? '—'}
                </p>
                <p
                  className="flex items-center gap-2 text-sm text-on-surface-variant"
                  dir="ltr"
                >
                  <Phone className="h-4 w-4" />
                  {customer.phone ?? '—'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-container/15 text-primary-container">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-on-surface">
                    {customer.orderCount}
                  </p>
                  <p className="text-xs text-on-surface-variant">{c.orders}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-tertiary-container/15 text-tertiary">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <p
                    className="text-2xl font-semibold text-on-surface"
                    dir="ltr"
                  >
                    {formatPrice(customer.totalSpent)}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {c.totalSpent}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{c.recentOrders}</CardTitle>
            </CardHeader>
            {customer.recentOrders.length === 0 ? (
              <EmptyState icon={ShoppingBag} message={c.noOrders} />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant text-start text-xs uppercase tracking-wide text-on-surface-variant">
                    <th className="px-4 py-3 font-semibold">
                      {strings.commerce.orders.orderNumber}
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      {strings.commerce.orders.date}
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      {strings.commerce.orders.status}
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      {strings.commerce.orders.paymentStatus}
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      {strings.commerce.orders.total}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {customer.recentOrders.map((order) => (
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
                      <td
                        className="px-4 py-3 text-on-surface-variant"
                        dir="ltr"
                      >
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3">
                        <PaymentStatusBadge status={order.paymentStatus} />
                      </td>
                      <td className="px-4 py-3 font-medium" dir="ltr">
                        {formatPrice(order.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
