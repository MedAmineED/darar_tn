import { apiClient, unwrap } from './client';
import type { ApiSuccess, Paginated } from './types';
import type {
  Product,
  ProductImage,
  ProductInput,
  CreateProductInput,
  ProductListParams,
} from './catalog-types';

export async function listProducts(
  params: ProductListParams,
): Promise<Paginated<Product>> {
  const res = await apiClient.get<ApiSuccess<Paginated<Product>>>('/products', {
    params,
  });
  return unwrap(res);
}

/** Replaces the homepage selection with these products, in this order. */
export async function setFeaturedProducts(productIds: string[]): Promise<void> {
  await apiClient.put('/products/featured', { productIds });
}

export async function getProduct(id: string): Promise<Product> {
  const res = await apiClient.get<ApiSuccess<Product>>(`/products/${id}`);
  return unwrap(res);
}

export async function createProduct(
  input: CreateProductInput,
): Promise<Product> {
  const res = await apiClient.post<ApiSuccess<Product>>('/products', input);
  return unwrap(res);
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput>,
): Promise<Product> {
  const res = await apiClient.patch<ApiSuccess<Product>>(
    `/products/${id}`,
    input,
  );
  return unwrap(res);
}

export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/products/${id}`);
}

// ── Images ──────────────────────────────────────────────────

export async function uploadProductImages(
  productId: string,
  files: File[],
): Promise<ProductImage[]> {
  const form = new FormData();
  files.forEach((file) => form.append('files', file));
  const res = await apiClient.post<ApiSuccess<ProductImage[]>>(
    `/products/${productId}/images`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return unwrap(res);
}

export async function setPrimaryImage(
  productId: string,
  imageId: string,
): Promise<ProductImage[]> {
  const res = await apiClient.patch<ApiSuccess<ProductImage[]>>(
    `/products/${productId}/images/${imageId}/primary`,
  );
  return unwrap(res);
}

export async function deleteProductImage(
  productId: string,
  imageId: string,
): Promise<ProductImage[]> {
  const res = await apiClient.delete<ApiSuccess<ProductImage[]>>(
    `/products/${productId}/images/${imageId}`,
  );
  return unwrap(res);
}
