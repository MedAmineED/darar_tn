'use client';

import { useState, useTransition, type FormEvent } from 'react';
import Link from 'next/link';
import type { Locale } from '@/lib/i18n/config';
import { localize } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/components/cart/CartProvider';
import { useDelivery } from '@/components/cart/DeliveryProvider';
import { deliveryFeeFor } from '@/lib/delivery';
import { Icon } from '@/components/ui/Icon';
import { submitOrder } from '@/lib/actions/checkout';

interface Success {
  orderNumber: string;
  total: number;
}

export function CheckoutForm({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const { items, subtotal, clear } = useCart();
  const delivery = useDelivery();
  const shipping = deliveryFeeFor(subtotal, delivery);
  const total = subtotal + shipping;
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<Success | null>(null);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      customerName: String(form.get('name') ?? ''),
      customerPhone: String(form.get('phone') ?? ''),
      customerEmail: String(form.get('email') ?? ''),
      shippingAddress: String(form.get('address') ?? ''),
      notes: String(form.get('notes') ?? ''),
      items: items.map((i) => ({ slug: i.slug, quantity: i.qty })),
    };
    start(async () => {
      const res = await submitOrder(payload);
      if (res.ok) {
        clear();
        setSuccess({ orderNumber: res.orderNumber, total: res.total });
      } else {
        setError(
          res.code === 'PRODUCT_UNAVAILABLE'
            ? dict.checkout.errorUnavailable
            : dict.checkout.errorGeneric,
        );
      }
    });
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto text-center py-10">
        <span className="inline-grid place-items-center h-16 w-16 rounded-full bg-olive/15 text-olive mx-auto">
          <Icon name="check" className="!text-[32px]" label="ok" />
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-primary mt-6">
          {dict.checkout.successTitle}
        </h1>
        <p className="text-on-surface-variant mt-3">{dict.checkout.successBody}</p>
        <div className="card mt-6 inline-flex flex-col items-center px-8 py-5 rounded-lg bg-surface-low">
          <span className="text-xs uppercase tracking-widest text-on-surface-variant">
            {dict.checkout.orderNumber}
          </span>
          <span dir="ltr" className="font-display text-2xl font-bold text-primary mt-1">
            {success.orderNumber}
          </span>
          <span className="text-sm text-on-surface-variant mt-2">
            {dict.checkout.total}: {formatPrice(success.total, dict.common.currency)}
          </span>
        </div>
        <div className="mt-8">
          <Link href="/shop" className="btn btn-primary px-8 py-4 text-sm">
            {dict.cart.continue}
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <Icon name="shopping_bag" className="!text-[40px] text-outline-variant" />
        <h1 className="font-display text-2xl font-semibold mt-4">
          {dict.checkout.emptyTitle}
        </h1>
        <p className="text-on-surface-variant mt-2">{dict.checkout.emptyHint}</p>
        <Link href="/shop" className="btn btn-primary px-8 py-4 text-sm mt-6">
          {dict.cart.continue}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid lg:grid-cols-[1fr_380px] gap-10 lg:gap-16">
      {/* Contact + delivery */}
      <div>
        <h2 className="font-display text-2xl font-semibold mb-6">
          {dict.checkout.contactInfo}
        </h2>
        <div className="grid sm:grid-cols-2 gap-5">
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium">{dict.checkout.name}</span>
            <input
              name="name"
              required
              maxLength={200}
              className="mt-1 w-full rounded border border-outline-variant bg-white px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">{dict.checkout.phone}</span>
            <input
              name="phone"
              type="tel"
              required
              dir="ltr"
              minLength={6}
              maxLength={30}
              className="mt-1 w-full rounded border border-outline-variant bg-white px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">
              {dict.checkout.email}{' '}
              <span className="text-outline">({dict.checkout.optional})</span>
            </span>
            <input
              name="email"
              type="email"
              dir="ltr"
              maxLength={150}
              className="mt-1 w-full rounded border border-outline-variant bg-white px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium">{dict.checkout.address}</span>
            <textarea
              name="address"
              required
              rows={2}
              maxLength={500}
              placeholder={dict.checkout.addressHint}
              className="mt-1 w-full rounded border border-outline-variant bg-white px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium">
              {dict.checkout.notes}{' '}
              <span className="text-outline">({dict.checkout.optional})</span>
            </span>
            <textarea
              name="notes"
              rows={2}
              maxLength={1000}
              className="mt-1 w-full rounded border border-outline-variant bg-white px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </label>
        </div>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-28 self-start">
        <div className="card rounded-lg bg-surface-low p-6">
          <h2 className="font-display text-xl font-semibold mb-4">
            {dict.checkout.summary}
          </h2>
          <ul className="flex flex-col gap-3">
            {items.map((item) => (
              <li key={item.slug} className="flex justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="font-medium">
                    {localize(locale, item.nameAr, item.nameFr)}
                  </span>
                  <span className="text-on-surface-variant"> × {item.qty}</span>
                </span>
                <span className="whitespace-nowrap">
                  {formatPrice(item.price * item.qty, dict.common.currency)}
                </span>
              </li>
            ))}
          </ul>
          <div className="border-t hairline mt-4 pt-4 flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-on-surface-variant">{dict.checkout.subtotal}</span>
              <span>{formatPrice(subtotal, dict.common.currency)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-on-surface-variant">{dict.checkout.delivery}</span>
              <span>
                {shipping === 0
                  ? dict.checkout.deliveryFree
                  : formatPrice(shipping, dict.common.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t hairline">
              <span className="font-medium">{dict.checkout.total}</span>
              <span className="font-display text-xl font-semibold text-primary">
                {formatPrice(total, dict.common.currency)}
              </span>
            </div>
          </div>
          <p className="text-xs text-outline mt-2">{dict.checkout.codNote}</p>

          {error && (
            <p className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="btn btn-primary w-full py-3.5 text-sm mt-5 disabled:opacity-60"
          >
            {pending ? dict.checkout.placing : dict.checkout.place}
          </button>
        </div>
      </aside>
    </form>
  );
}
