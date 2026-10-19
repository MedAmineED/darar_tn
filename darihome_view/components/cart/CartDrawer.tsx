'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Locale } from '@/lib/i18n/config';
import { localize } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import { formatPrice } from '@/lib/format';
import { cartItemHref } from '@/lib/cart';
import { clsx } from '@/lib/clsx';
import { Icon } from '@/components/ui/Icon';
import { useCart } from './CartProvider';
import { useDelivery } from './DeliveryProvider';
import { deliveryFeeFor } from '@/lib/delivery';

export function CartDrawer({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const { items, subtotal, isOpen, close, setQty, remove } = useCart();
  const delivery = useDelivery();
  const shipping = deliveryFeeFor(subtotal, delivery);
  const total = subtotal + shipping;

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, close]);

  return (
    <>
      <div
        onClick={close}
        className={clsx('scrim fixed inset-0 z-[60] bg-black/40', isOpen && 'is-open')}
      />
      <aside
        className={clsx(
          'drawer fixed top-0 end-0 z-[65] h-full w-[88%] max-w-md bg-surface shadow-2xl flex flex-col',
          isOpen && 'is-open',
        )}
        aria-hidden={!isOpen}
        aria-label={dict.cart.title}
      >
        <div className="flex items-center justify-between h-20 px-6 border-b hairline shrink-0">
          <span className="font-display text-xl font-bold">
            {dict.cart.title}
          </span>
          <button
            type="button"
            onClick={close}
            aria-label={dict.nav.close}
            className="h-10 w-10 inline-flex items-center justify-center rounded hover:bg-black/5"
          >
            <Icon name="close" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <Icon name="shopping_bag" className="!text-[40px] text-outline-variant" />
            <p className="font-display text-lg font-semibold">{dict.cart.empty}</p>
            <p className="text-sm text-on-surface-variant">{dict.cart.emptyHint}</p>
            <Link href="/shop" onClick={close} className="btn btn-primary px-6 py-3 text-sm mt-2">
              {dict.cart.continue}
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
              {items.map((item) => {
                const name = localize(locale, item.nameAr, item.nameFr);
                return (
                  <li key={item.slug} className="flex gap-4">
                    <Link
                      href={cartItemHref(item.slug)}
                      onClick={close}
                      className="relative h-20 w-20 shrink-0 rounded overflow-hidden bg-surface-low"
                    >
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : null}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={cartItemHref(item.slug)}
                        onClick={close}
                        className="font-display font-semibold leading-snug hover:text-primary line-clamp-2"
                      >
                        {name}
                      </Link>
                      <p className="text-sm text-on-surface-variant mt-0.5">
                        {formatPrice(item.price, dict.common.currency)}{' '}
                        <span className="text-outline">/ {dict.cart.each}</span>
                      </p>
                      <div className="flex items-center justify-between mt-2 gap-3">
                        <div className="inline-flex items-center border border-outline-variant rounded overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setQty(item.slug, item.qty - 1)}
                            className="h-8 w-8 grid place-items-center hover:bg-surface-high transition-colors disabled:opacity-40"
                            aria-label="-"
                            disabled={item.qty <= 1}
                          >
                            <Icon name="remove" className="!text-[18px]" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQty(item.slug, item.qty + 1)}
                            className="h-8 w-8 grid place-items-center hover:bg-surface-high transition-colors"
                            aria-label="+"
                          >
                            <Icon name="add" className="!text-[18px]" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(item.slug)}
                          className="text-sm text-outline hover:text-primary"
                        >
                          {dict.cart.remove}
                        </button>
                      </div>
                    </div>
                    <div className="text-sm font-semibold whitespace-nowrap">
                      {formatPrice(item.price * item.qty, dict.common.currency)}
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="border-t hairline px-6 py-5 shrink-0">
              <div className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant">{dict.cart.subtotal}</span>
                <span>{formatPrice(subtotal, dict.common.currency)}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1.5">
                <span className="text-on-surface-variant">{dict.cart.delivery}</span>
                <span>
                  {shipping === 0
                    ? dict.cart.deliveryFree
                    : formatPrice(shipping, dict.common.currency)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t hairline">
                <span className="font-medium">{dict.cart.total}</span>
                <span className="font-display text-xl font-semibold text-primary">
                  {formatPrice(total, dict.common.currency)}
                </span>
              </div>
              <Link
                href="/checkout"
                onClick={close}
                className="btn btn-primary w-full py-3.5 text-sm mt-4"
              >
                {dict.cart.checkout}
              </Link>
              <button
                type="button"
                onClick={close}
                className="btn btn-ghost w-full py-3 text-sm mt-2 text-primary"
              >
                {dict.cart.continue}
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
