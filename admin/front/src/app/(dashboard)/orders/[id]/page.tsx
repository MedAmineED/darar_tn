'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/common/empty-state';
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from '@/components/orders/order-badges';
import { useLocale } from '@/contexts/locale-context';
import { formatDate, formatPrice } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/api/client';
import type { OrderStatus, PaymentStatus } from '@/lib/api/commerce-types';
import { useOrder, useUpdateOrder } from '@/hooks/use-orders';
import { useAuth } from '@/providers/auth-provider';

const ORDER_STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];
const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['CANCELLED'],
  CANCELLED: [],
};
const PAYMENT_STATUSES: PaymentStatus[] = [
  'PENDING',
  'PAID',
  'FAILED',
  'REFUNDED',
];

export default function OrderDetailPage() {
  const { strings, locale, t } = useLocale();
  const stockLabels = {
    LEGACY: t(
      'طلب سابق: لا يؤثر على المخزون',
      'Ancienne commande : sans effet sur le stock',
    ),
    UNCOMMITTED: t(
      'يُخصم المخزون عند التأكيد',
      'Le stock sera déduit à la confirmation',
    ),
    DEDUCTED: t('تم خصم المخزون', 'Stock déduit'),
    RESTORED: t('تمت إعادة المخزون', 'Stock rétabli'),
  };

  const o = strings.commerce.orders;
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { hasPermission } = useAuth();
  const canUpdate = hasPermission('order:update');

  const { data: order, isLoading, isError } = useOrder(params.id);
  const update = useUpdateOrder();

  const [status, setStatus] = useState<OrderStatus>('PENDING');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('PENDING');

  useEffect(() => {
    if (order) {
      setStatus(order.status);
      setPaymentStatus(order.paymentStatus);
    }
  }, [order]);

  const saveStatus = async () => {
    if (!order) return;
    try {
      await update.mutateAsync({
        id: order.id,
        input: { status, paymentStatus },
      });
      toast.success(strings.common.saved);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }
  if (isError || !order) {
    return (
      <EmptyState icon={ShoppingCart} message={strings.common.noResults} />
    );
  }

  const dirty =
    status !== order.status || paymentStatus !== order.paymentStatus;

  return (
    <div>
      <PageHeader
        title={`${o.detail} ${order.orderNumber}`}
        action={
          <Button variant="secondary" onClick={() => router.push('/orders')}>
            <ArrowRight className="h-4 w-4 ltr:rotate-180" />
            {strings.common.back}
          </Button>
        }
      />

      <p className="mb-4 rounded border border-outline-variant bg-surface-container p-3 text-sm">
        {order.stockState
          ? stockLabels[order.stockState]
          : t('حالة المخزون غير متاحة', 'État du stock indisponible')}
      </p>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Items + totals */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{o.items}</CardTitle>
            </CardHeader>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant text-start text-xs uppercase tracking-wide text-on-surface-variant">
                  <th className="px-4 py-3 font-semibold">{o.item}</th>
                  <th className="px-4 py-3 font-semibold">{o.unitPrice}</th>
                  <th className="px-4 py-3 font-semibold">{o.quantity}</th>
                  <th className="px-4 py-3 font-semibold">{o.lineTotal}</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-outline-variant/60 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-on-surface">
                        {locale === 'ar'
                          ? item.productNameAr
                          : item.productNameFr}
                      </p>
                      <p
                        className="text-xs text-on-surface-variant"
                        dir={locale === 'ar' ? 'ltr' : 'rtl'}
                      >
                        {locale === 'ar'
                          ? item.productNameFr
                          : item.productNameAr}
                        {item.productSku ? ` · ${item.productSku}` : ''}
                      </p>
                      {item.packId && (
                        <p className="mt-0.5 text-[11px] font-semibold text-primary-container">
                          🎁{' '}
                          {locale === 'ar' ? item.packNameAr : item.packNameFr}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3" dir="ltr">
                      {formatPrice(item.productPrice)}
                    </td>
                    <td className="px-4 py-3" dir="ltr">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 font-medium" dir="ltr">
                      {formatPrice(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <CardContent className="space-y-1.5 border-t border-outline-variant">
              <Row label={o.subtotal} value={formatPrice(order.subtotal)} />
              <Row
                label={o.discount}
                value={`- ${formatPrice(order.discountAmount)}`}
              />
              <Row
                label={o.shipping}
                value={formatPrice(order.shippingAmount)}
              />
              <div className="flex justify-between border-t border-outline-variant pt-2 font-heading text-lg font-semibold text-on-surface">
                <span>{o.total}</span>
                <span dir="ltr">{formatPrice(order.totalAmount)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: status, customer */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{o.updateStatus}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <OrderStatusBadge status={order.status} />
                <PaymentStatusBadge status={order.paymentStatus} />
              </div>
              <div>
                <Label htmlFor="status">{o.status}</Label>
                <Select
                  id="status"
                  value={status}
                  disabled={!canUpdate}
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                >
                  {ORDER_STATUSES.filter(
                    (s) =>
                      s === order.status ||
                      NEXT_STATUSES[order.status].includes(s),
                  ).map((s) => (
                    <option key={s} value={s}>
                      {strings.commerce.orderStatus[s]}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="paymentStatus">{o.paymentStatus}</Label>
                <Select
                  id="paymentStatus"
                  value={paymentStatus}
                  disabled={!canUpdate}
                  onChange={(e) =>
                    setPaymentStatus(e.target.value as PaymentStatus)
                  }
                >
                  {PAYMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {strings.commerce.paymentStatus[s]}
                    </option>
                  ))}
                </Select>
              </div>
              {canUpdate && (
                <Button
                  className="w-full"
                  disabled={!dirty}
                  isLoading={update.isPending}
                  onClick={saveStatus}
                >
                  {strings.common.save}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{o.customer}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              <p className="font-medium text-on-surface">
                {order.customerName}
              </p>
              {order.customerPhone && (
                <p className="text-on-surface-variant" dir="ltr">
                  {order.customerPhone}
                </p>
              )}
              {order.customerEmail && (
                <p className="text-on-surface-variant" dir="ltr">
                  {order.customerEmail}
                </p>
              )}
              {order.shippingAddress && (
                <p className="pt-2 text-on-surface-variant">
                  <span className="block text-xs font-semibold">
                    {o.shippingAddress}
                  </span>
                  {order.shippingAddress}
                </p>
              )}
              <p className="pt-2 text-xs text-on-surface-variant" dir="ltr">
                {formatDate(order.createdAt)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-on-surface-variant">{label}</span>
      <span dir="ltr">{value}</span>
    </div>
  );
}
