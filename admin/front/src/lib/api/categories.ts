import { apiClient, unwrap } from './client';
import type { ApiSuccess, Paginated } from './types';
import type {
  Category,
  CategoryInput,
  CategoryTreeNode,
} from './catalog-types';

export async function listCategories(params: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<Paginated<Category>> {
  const res = await apiClient.get<ApiSuccess<Paginated<Category>>>(
    '/categories',
    { params },
  );
  return unwrap(res);
}

export async function getCategoryTree(): Promise<CategoryTreeNode[]> {
  const res =
    await apiClient.get<ApiSuccess<CategoryTreeNode[]>>('/categories/tree');
  return unwrap(res);
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const res = await apiClient.post<ApiSuccess<Category>>('/categories', input);
  return unwrap(res);
}

export async function updateCategory(
  id: string,
  input: Partial<CategoryInput>,
): Promise<Category> {
  const res = await apiClient.patch<ApiSuccess<Category>>(
    `/categories/${id}`,
    input,
  );
  return unwrap(res);
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/categories/${id}`);
}

/** Uploads a category image and returns its stored (relative) URL. */
export async function uploadCategoryImage(
  file: File,
): Promise<{ url: string }> {
  const form = new FormData();
  form.append('file', file);
  const res = await apiClient.post<ApiSuccess<{ url: string }>>(
    '/categories/upload-image',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return unwrap(res);
}
