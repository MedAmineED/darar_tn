import 'server-only';
import { ApiError, apiGet } from './client';
import { resolveMediaUrl } from '@/lib/media';

export interface StorefrontPackItem {
  productId: string;
  quantity: number;
  nameAr: string;
  nameFr: string;
  slug: string;
  unitPrice: number;
  image: string | null;
}

export interface StorefrontPack {
  id: string;
  nameAr: string;
  nameFr: string;
  slug: string;
  descriptionAr: string | null;
  descriptionFr: string | null;
  price: number;
  regularPrice: number;
  discountPercentage: number | null;
  image: string | null;
  isFeatured: boolean;
  items: StorefrontPackItem[];
}

function mapPack(pack: StorefrontPack): StorefrontPack {
  return {
    ...pack,
    image: resolveMediaUrl(pack.image),
    items: pack.items.map((i) => ({ ...i, image: resolveMediaUrl(i.image) })),
  };
}

/** Active offer packs (bundles sold at one special price). */
export async function getPacks(): Promise<StorefrontPack[]> {
  const packs = await apiGet<StorefrontPack[]>('/storefront/packs');
  return packs.map(mapPack);
}

/** One active pack by slug, or null when it is missing or unpublished. */
export async function getPack(slug: string): Promise<StorefrontPack | null> {
  try {
    const pack = await apiGet<StorefrontPack>(
      `/storefront/packs/${encodeURIComponent(slug)}`,
    );
    return mapPack(pack);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}
