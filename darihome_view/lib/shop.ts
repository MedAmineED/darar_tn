import { isProductSort, type ProductSort } from './api/types';

export interface ShopParams {
  category?: string;
  sort: ProductSort;
  page: number;
  search?: string;
}

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Parse + sanitize shop URL params (never trust raw query strings). */
export function parseShopParams(raw: RawParams): ShopParams {
  const sortRaw = first(raw.sort);
  const pageRaw = Number.parseInt(first(raw.page) ?? '1', 10);
  const search = first(raw.search)?.trim();
  const category = first(raw.category)?.trim();
  return {
    category: category || undefined,
    sort: isProductSort(sortRaw) ? sortRaw : 'popular',
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1,
    search: search || undefined,
  };
}

/** Build a /shop href from the current params plus overrides. */
export function buildShopHref(
  current: ShopParams,
  overrides: Partial<ShopParams> = {},
): string {
  const next = { ...current, ...overrides };
  const params = new URLSearchParams();
  if (next.category) params.set('category', next.category);
  if (next.sort !== 'popular') params.set('sort', next.sort);
  if (next.search) params.set('search', next.search);
  if (next.page > 1) params.set('page', String(next.page));
  const qs = params.toString();
  return qs ? `/shop?${qs}` : '/shop';
}
