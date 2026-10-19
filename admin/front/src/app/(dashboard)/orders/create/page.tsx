'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLocale } from '@/contexts/locale-context';
import { formatPrice } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/api/client';
import type {
  CreateOrderInput,
  OrderStatus,
  PaymentStatus,
} from '@/lib/api/commerce-types';
import { useProducts } from '@/hooks/use-products';
import { useCustomers } from '@/hooks/use-customers';
import { useCreateOrder } from '@/hooks/use-orders';
import { usePacks } from '@/hooks/use-packs';

// Pack rows share the product select; their value is prefixed.
const PACK = 'pack:';

interface ItemRow {
  productId: string;
  quantity: number;
}

const ORDER_STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED'];
const PAYMENT_STATUSES: PaymentStatus[] = [
  'PENDING',
  'PAID',
  'FAILED',
  'REFUNDED',
];

export default function CreateOrderPage() {
  const { strings, locale } = useLocale();
  const o = strings.commerce.orders;
  const router = useRouter();
  const create = useCreateOrder();
  const [requestKey] = useState(() => crypto.randomUUID());

  const { data: productsData } = useProducts({ limit: 100, status: 'ACTIVE' });
  const { data: customersData } = useCustomers({ limit: 100 });
  const products = useMemo(() => productsData?.items ?? [], [productsData]);
  const { data: packsData } = usePacks({ limit: 100, status: 'ACTIVE' });
  const packs = useMemo(() => packsData?.items ?? [], [packsData]);
  const priceById = useMemo(
    () =>
      new Map([
        ...products.map((p) => [p.id, p.price] as const),
        ...packs.map((p) => [`${PACK}${p.id}`, p.price] as const),
      ]),
    [products, packs],
  );

  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [items, setItems] = useState<ItemRow[]>([
    { productId: '', quantity: 1 },
  ]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [shippingAmount, setShippingAmount] = useState(0);
  const [status, setStatus] = useState<OrderStatus>('PENDING');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('PENDING');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');

  const setItem = (index: number, patch: Partial<ItemRow>) =>
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, ...patch } : it)),
    );
  const addItem = () =>
    setItems((prev) => [...prev, { productId: '', quantity: 1 }]);
  const removeItem = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const subtotal = items.reduce((sum, it) => {
    const price = priceById.get(it.productId) ?? 0;
    return sum + price * it.quantity;
  }, 0);
  const total = Math.max(0, subtotal - discountAmount + shippingAmount);

  const submit = async () => {
    const validItems = items.filter((it) => it.productId && it.quantity > 0);
    if (validItems.length === 0) {
      toast.error(o.noItems);
      return;
    }
    if (!customerId && !customerName.trim()) {
      toast.error(strings.common.required);
      return;
    }
    const payload: CreateOrderInput = {
      requestKey,
      customerId: customerId || undefined,
      customerName: !customerId ? customerName : undefined,
      customerPhone: !customerId ? customerPhone || undefined : undefined,
      customerEmail: !customerId ? customerEmail || undefined : undefined,
      shippingAddress: shippingAddress || undefined,
      notes: notes || undefined,
      paymentMethod: paymentMethod || undefined,
      status,
      paymentStatus,
      discountAmount,
      shippingAmount,
      items: validItems.filter((it) => !it.productId.startsWith(PACK)),
      packs: validItems
        .filter((it) => it.productId.startsWith(PACK))
        .map((it) => ({
          packId: it.productId.slice(PACK.length),
          quantity: it.quantity,
        })),
    };
    try {
      const order = await create.mutateAsync(payload);
      toast.success(strings.common.saved);
      router.push(`/orders/${order.id}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <div>
      <PageHeader
        title={o.create}
        action={
          <Button variant="secondary" onClick={() => router.push('/orders')}>
            <ArrowRight className="h-4 w-4 ltr:rotate-180" />
            {strings.common.back}
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{o.items}</CardTitle>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addItem}
              >
                <Plus className="h-4 w-4" />
                {o.addItem}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((item, index) => {
                const price = priceById.get(item.productId) ?? 0;
                return (
                  <div key={index} className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label>{o.item}</Label>
                      <Select
                        value={item.productId}
                        onChange={(e) =>
                          setItem(index, { productId: e.target.value })
                        }
                      >
                        <option value="">{o.selectProduct}</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {locale === 'ar' ? p.nameAr : p.nameFr} —{' '}
                            {formatPrice(p.price)}
                          </option>
                        ))}
                        {packs.length > 0 && (
                          <optgroup
                            label={locale === 'ar' ? 'الباقات' : 'Packs'}
                          >
                            {packs.map((p) => (
                              <option key={p.id} value={`${PACK}${p.id}`}>
                                🎁 {locale === 'ar' ? p.nameAr : p.nameFr} —{' '}
                                {formatPrice(p.price)}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </Select>
                    </div>
                    <div className="w-20">
                      <Label>{o.quantity}</Label>
                      <Input
                        type="number"
                        min={1}
                        dir="ltr"
                        value={item.quantity}
                        onChange={(e) =>
                          setItem(index, {
                            quantity: Math.max(1, Number(e.target.value) || 1),
                          })
                        }
                      />
                    </div>
                    <div className="w-24 pb-2 text-sm" dir="ltr">
                      {formatPrice(price * item.quantity)}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                      className="mb-1 rounded p-2 text-error hover:bg-error-container/40 disabled:opacity-40"
                      aria-label={strings.common.delete}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Customer */}
          <Card>
            <CardHeader>
              <CardTitle>{o.customer}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{o.selectCustomer}</Label>
                <Select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                >
                  <option value="">{o.guestCustomer}</option>
                  {(customersData?.items ?? []).map((cust) => (
                    <option key={cust.id} value={cust.id}>
                      {cust.firstName} {cust.lastName}
                    </option>
                  ))}
                </Select>
              </div>
              {!customerId && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Input
                    placeholder={strings.commerce.customers.firstName}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                  <Input
                    dir="ltr"
                    placeholder={strings.commerce.customers.phone}
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                  <Input
                    dir="ltr"
                    placeholder={strings.commerce.customers.email}
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                  />
                </div>
              )}
              <div>
                <Label>{o.shippingAddress}</Label>
                <Textarea
                  rows={2}
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                />
              </div>
              <div>
                <Label>{o.notes}</Label>
                <Textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{o.total}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{o.discount}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    dir="ltr"
                    value={discountAmount}
                    onChange={(e) =>
                      setDiscountAmount(Number(e.target.value) || 0)
                    }
                  />
                </div>
                <div>
                  <Label>{o.shipping}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    dir="ltr"
                    value={shippingAmount}
                    onChange={(e) =>
                      setShippingAmount(Number(e.target.value) || 0)
                    }
                  />
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">{o.subtotal}</span>
                <span dir="ltr">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between border-t border-outline-variant pt-2 font-heading text-lg font-semibold">
                <span>{o.total}</span>
                <span dir="ltr">{formatPrice(total)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{o.status}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{o.status}</Label>
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {strings.commerce.orderStatus[s]}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>{o.paymentStatus}</Label>
                <Select
                  value={paymentStatus}
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
              <div>
                <Label>{o.paymentMethod}</Label>
                <Input
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                size="lg"
                isLoading={create.isPending}
                onClick={submit}
              >
                {o.create}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
