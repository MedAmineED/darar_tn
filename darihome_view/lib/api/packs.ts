import 'server-only';
import { apiGet } from './client';
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

/** Active offer packs (bundles sold at one special price). */
export async function getPacks(): Promise<StorefrontPack[]> {
  const packs = await apiGet<StorefrontPack[]>('/storefront/packs');
  return packs.map((pack) => ({
    ...pack,
    image: resolveMediaUrl(pack.image),
    items: pack.items.map((i) => ({ ...i, image: resolveMediaUrl(i.image) })),
  }));
}
