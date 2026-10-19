import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createCategory,
  deleteCategory,
  getCategoryTree,
  listCategories,
  updateCategory,
} from '@/lib/api/categories';
import type { CategoryInput } from '@/lib/api/catalog-types';

const KEY = 'categories';

export function useCategories(params: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => listCategories(params),
  });
}

export function useCategoryTree() {
  return useQuery({ queryKey: [KEY, 'tree'], queryFn: getCategoryTree });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CategoryInput) => createCategory(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CategoryInput> }) =>
      updateCategory(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
