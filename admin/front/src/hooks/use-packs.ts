import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPack,
  deletePack,
  listPacks,
  updatePack,
  uploadPackImage,
  type PackInput,
  type PackListParams,
} from '@/lib/api/packs';

const KEY = 'packs';

export function usePacks(params: PackListParams) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => listPacks(params),
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: [KEY] });
}

export function useCreatePack() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: PackInput) => createPack(input),
    onSuccess: invalidate,
  });
}

export function useUpdatePack() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PackInput> }) =>
      updatePack(id, input),
    onSuccess: invalidate,
  });
}

export function useDeletePack() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => deletePack(id),
    onSuccess: invalidate,
  });
}

export function useUploadPackImage() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      uploadPackImage(id, file),
    onSuccess: invalidate,
  });
}
