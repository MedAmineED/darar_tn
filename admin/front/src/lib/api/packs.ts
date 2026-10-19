import { apiClient, unwrap } from './client';
import type { ApiSuccess, Paginated } from './types';
import type { ProductStatus } from './catalog-types';

export interface PackItem {
  productId: string;
  quantity: number;
  nameAr: string;
  nameFr: string;
  slug: string;
  sku: string | null;
  unitPrice: number;
  unitCost: number | null;
  image: string | null;
  status: ProductStatus;
}

export interface Pack {
  id: string;
  nameAr: string;
  nameFr: string;
  slug: string;
  descriptionAr: string | null;
  descriptionFr: string | null;
  price: number;
  regularPrice: number;
  discountPercentage: number | null;
  cost: number | null;
  image: string | null;
  status: ProductStatus;
  isFeatured: boolean;
  items: PackItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PackInput {
  nameAr: string;
  nameFr: string;
  descriptionAr?: string;
  descriptionFr?: string;
  price: number;
  status: ProductStatus;
  isFeatured: boolean;
  items: { productId: string; quantity: number }[];
}

export interface PackListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProductStatus;
}

export async function listPacks(
  params: PackListParams,
): Promise<Paginated<Pack>> {
  const res = await apiClient.get<ApiSuccess<Paginated<Pack>>>('/packs', {
    params,
  });
  return unwrap(res);
}

export async function createPack(input: PackInput): Promise<Pack> {
  return unwrap(await apiClient.post<ApiSuccess<Pack>>('/packs', input));
}

export async function updatePack(
  id: string,
  input: Partial<PackInput>,
): Promise<Pack> {
  return unwrap(await apiClient.patch<ApiSuccess<Pack>>(`/packs/${id}`, input));
}

export async function deletePack(id: string): Promise<{ archived: boolean }> {
  return unwrap(
    await apiClient.delete<ApiSuccess<{ archived: boolean }>>(`/packs/${id}`),
  );
}

export async function uploadPackImage(id: string, file: File): Promise<Pack> {
  const form = new FormData();
  form.append('file', file);
  return unwrap(
    await apiClient.post<ApiSuccess<Pack>>(`/packs/${id}/image`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  );
}
