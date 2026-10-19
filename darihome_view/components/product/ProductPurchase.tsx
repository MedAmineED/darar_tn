'use client';

import { useState } from 'react';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { CartItemInput } from '@/lib/cart';
import { Icon } from '@/components/ui/Icon';
import { AddToCartButton } from './AddToCartButton';

/**
 * Interactive buy-box controls: quantity stepper + add-to-cart + wishlist.
 * Ported from initQty()/initCart() in the template's main.js.
 */
export function ProductPurchase({
  dict,
  item,
}: {
  dict: Dictionary;
  item: CartItemInput;
}) {
  const [qty, setQty] = useState(1);
  const clamp = (v: number) => Math.max(1, Math.min(99, Number.isNaN(v) ? 1 : v));

  return (
    // The sticky mobile buy bar observes this id and reveals itself once the
    // box has scrolled above the viewport.
    <div id="buy-box" className="mt-8">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-3">
        {dict.product.quantity}
      </h3>
      <div className="flex flex-wrap items-stretch gap-3">
        <div className="inline-flex items-center border border-outline-variant rounded overflow-hidden">
          <button
            type="button"
            onClick={() => setQty((q) => clamp(q - 1))}
            className="h-12 w-12 grid place-items-center hover:bg-surface-high transition-colors"
            aria-label="-"
          >
            <Icon name="remove" />
          </button>
          <input
            type="text"
            inputMode="numeric"
            value={qty}
            onChange={(e) => setQty(clamp(Number.parseInt(e.target.value, 10)))}
            className="w-12 h-12 text-center bg-transparent border-0 focus:ring-0 font-semibold"
            aria-label={dict.product.quantity}
          />
          <button
            type="button"
            onClick={() => setQty((q) => clamp(q + 1))}
            className="h-12 w-12 grid place-items-center hover:bg-surface-high transition-colors"
            aria-label="+"
          >
            <Icon name="add" />
          </button>
        </div>

        <AddToCartButton
          item={item}
          label={dict.product.addToCart}
          addedLabel={dict.product.added}
          className="flex-1 min-w-[180px] py-3.5 text-sm"
          getQty={() => qty}
        >
          <Icon name="shopping_bag" className="!text-[20px]" />
        </AddToCartButton>

        <button
          type="button"
          className="h-12 w-12 grid place-items-center rounded border border-outline-variant hover:bg-surface-high transition-colors"
          aria-label={dict.nav.wishlist}
        >
          <Icon name="favorite" />
        </button>
      </div>
    </div>
  );
}
