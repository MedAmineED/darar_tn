'use client';

import { useEffect, useState } from 'react';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { CartItemInput } from '@/lib/cart';
import { formatPrice } from '@/lib/format';
import { clsx } from '@/lib/clsx';
import { AddToCartButton } from './AddToCartButton';

/**
 * Mobile-only sticky buy bar.
 *
 * On a phone the real buy box scrolls out of view long before the shopper has
 * finished reading the description, and the scroll back up to it frequently
 * just does not happen. This bar slides in once the buy box has passed above
 * the viewport, so the primary action is always one tap away. Desktop keeps
 * the buy box on screen beside the gallery, so the bar stays hidden there.
 */
export function StickyBuyBar({
  dict,
  item,
  name,
  watchId,
}: {
  dict: Dictionary;
  item: CartItemInput;
  name: string;
  watchId: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const target = document.getElementById(watchId);
    if (!target) return;

    // Recomputed from geometry on every event rather than from
    // IntersectionObserver transitions: an anchor jump or a restored scroll
    // position can land past the buy box without ever crossing it, and a
    // transition-based check stays wrong in that case. `bottom < 0` means the
    // box has left the top of the viewport.
    //
    // Measured straight from the listener, with no requestAnimationFrame gate.
    // It is one rect read on one element, and `setShow` bails out when the
    // boolean is unchanged, so this cannot thrash layout — while a dropped or
    // coalesced frame would otherwise leave the bar stuck in the wrong state.
    const measure = () => setShow(target.getBoundingClientRect().bottom < 0);

    measure();
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure, { passive: true });
    return () => {
      window.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [watchId]);

  return (
    <div
      className={clsx(
        'fixed inset-x-0 bottom-0 z-40 border-t hairline bg-surface/95 backdrop-blur transition-transform duration-300 lg:hidden',
        show ? 'translate-y-0' : 'pointer-events-none translate-y-full',
      )}
      aria-hidden={!show}
    >
      <div className="flex items-center gap-3 px-5 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">{name}</p>
          <p className="font-display text-base font-semibold text-primary">
            {formatPrice(item.price, dict.common.currency)}
          </p>
        </div>
        <AddToCartButton
          item={item}
          label={dict.product.addToCart}
          addedLabel={dict.product.added}
          className="shrink-0 px-5 py-3 text-sm"
          tabIndex={show ? 0 : -1}
        />
      </div>
    </div>
  );
}
