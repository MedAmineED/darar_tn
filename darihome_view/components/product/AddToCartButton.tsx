'use client';

import { useRef, useState } from 'react';
import { useCart } from '@/components/cart/CartProvider';
import type { CartItemInput } from '@/lib/cart';
import { clsx } from '@/lib/clsx';

/**
 * Adds a product line item to the cart, with the template's "added ✓"
 * confirmation swap. `getQty` lets the product page feed the stepper value.
 */
export function AddToCartButton({
  item,
  label,
  addedLabel,
  className,
  children,
  getQty,
  tabIndex,
}: {
  item: CartItemInput;
  label: string;
  addedLabel: string;
  className?: string;
  children?: React.ReactNode;
  getQty?: () => number;
  /** Lets an off-screen caller drop out of the tab order. */
  tabIndex?: number;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onClick = () => {
    add(item, getQty ? getQty() : 1);
    setAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1600);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      tabIndex={tabIndex}
      className={clsx('btn btn-primary', className)}
    >
      {children}
      <span>{added ? addedLabel : label}</span>
    </button>
  );
}
