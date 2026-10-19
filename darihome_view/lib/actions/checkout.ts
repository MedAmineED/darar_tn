'use server';

import { ApiError } from '@/lib/api/client';
import { createStorefrontOrder, type CheckoutItem } from '@/lib/api/orders';
import { packSlugOf } from '@/lib/cart';

export interface CheckoutInput {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  notes?: string;
  items: CheckoutItem[];
}

export type CheckoutResult =
  | { ok: true; orderNumber: string; total: number }
  | { ok: false; code: string };

/**
 * Server Action: place a cash-on-delivery order. Runs on the server so the API
 * base URL stays server-only. Prices/availability are (re)validated by the
 * backend — the client's cart is only a hint. Returns an error CODE the client
 * maps to a localized message (never a raw backend/stack string).
 */
export async function submitOrder(
  input: CheckoutInput,
): Promise<CheckoutResult> {
  const lines = Array.isArray(input.items)
    ? input.items
        .filter((i) => i && typeof i.slug === 'string')
        .map((i) => ({
          slug: i.slug,
          quantity: Math.max(1, Math.min(99, Math.trunc(Number(i.quantity) || 1))),
        }))
    : [];

  if (lines.length === 0) return { ok: false, code: 'EMPTY_CART' };
  // Pack lines travel in the same cart with a "pack:" prefixed slug.
  const items = lines.filter((l) => packSlugOf(l.slug) === null);
  const packs = lines.flatMap((l) => {
    const slug = packSlugOf(l.slug);
    return slug ? [{ slug, quantity: l.quantity }] : [];
  });
  if (!input.customerName?.trim() || !input.customerPhone?.trim() || !input.shippingAddress?.trim()) {
    return { ok: false, code: 'MISSING_FIELDS' };
  }

  try {
    const confirmation = await createStorefrontOrder({
      customerName: input.customerName.trim(),
      customerPhone: input.customerPhone.trim(),
      customerEmail: input.customerEmail?.trim() || undefined,
      shippingAddress: input.shippingAddress.trim(),
      notes: input.notes?.trim() || undefined,
      items,
      packs,
    });
    return {
      ok: true,
      orderNumber: confirmation.orderNumber,
      total: confirmation.totalAmount,
    };
  } catch (err) {
    if (err instanceof ApiError) {
      return { ok: false, code: err.code ?? 'ORDER_FAILED' };
    }
    return { ok: false, code: 'ORDER_FAILED' };
  }
}
