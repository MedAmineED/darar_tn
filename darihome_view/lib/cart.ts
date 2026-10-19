/** Shared cart types. The cart is client-side only (no cart backend yet). */

export interface CartItemInput {
  slug: string;
  nameAr: string;
  nameFr: string;
  price: number;
  image: string | null;
}

export interface CartItem extends CartItemInput {
  qty: number;
}

export const CART_STORAGE_KEY = 'darihome_cart';

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.qty, 0);
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

/** Packs share the cart with products; a prefix keeps their keys distinct. */
const PACK_PREFIX = 'pack:';

export function packCartSlug(slug: string): string {
  return `${PACK_PREFIX}${slug}`;
}

/** The pack slug for a pack cart line, or null for a product line. */
export function packSlugOf(cartSlug: string): string | null {
  return cartSlug.startsWith(PACK_PREFIX)
    ? cartSlug.slice(PACK_PREFIX.length)
    : null;
}

export function cartItemHref(cartSlug: string): string {
  return packSlugOf(cartSlug) !== null ? '/packs' : `/products/${cartSlug}`;
}
