/**
 * Recently-viewed products. Browser-only, like the cart — there is no
 * per-visitor backend, and a browsing history is the shopper's own.
 */

export interface ViewedProduct {
  slug: string;
  nameAr: string;
  nameFr: string;
  price: number;
  image: string | null;
}

export const RECENTLY_VIEWED_KEY = 'darihome_recently_viewed';
export const RECENTLY_VIEWED_MAX = 8;

function isViewed(value: unknown): value is ViewedProduct {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as ViewedProduct).slug === 'string' &&
    typeof (value as ViewedProduct).price === 'number'
  );
}

export function readRecentlyViewed(): ViewedProduct[] {
  try {
    const raw = window.localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    // Defensive: only keep well-formed entries.
    return Array.isArray(parsed) ? parsed.filter(isViewed) : [];
  } catch {
    return [];
  }
}

/** Prepends `item`, de-duplicating by slug and capping the list. */
export function pushRecentlyViewed(item: ViewedProduct): void {
  try {
    const next = [
      item,
      ...readRecentlyViewed().filter((entry) => entry.slug !== item.slug),
    ].slice(0, RECENTLY_VIEWED_MAX);
    window.localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
  } catch {
    // Private mode or quota exceeded. This is a nicety, never a blocker.
  }
}
