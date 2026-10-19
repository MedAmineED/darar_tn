import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createUser,
  deleteUser,
  listRoles,
  listUsers,
  resetUserPassword,
  updateUser,
  type UserInput,
} from '@/lib/api/users';

const KEY = 'users';

export function useUsers(params: {
  page: number;
  limit: number;
  search?: string;
}) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => listUsers(params),
  });
}

export function useRoles(enabled = true) {
  return useQuery({ queryKey: ['roles'], queryFn: listRoles, enabled });
}

function useUsersMutation<T>(fn: (input: T) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export const useSaveUser = () =>
  useUsersMutation(({ id, input }: { id?: string; input: UserInput }) => {
    if (id) {
      const { password: _password, ...rest } = input;
      return updateUser(id, rest);
    }
    return createUser(input);
  });
export const useToggleUser = () =>
  useUsersMutation(({ id, isActive }: { id: string; isActive: boolean }) =>
    updateUser(id, { isActive }),
  );
export const useResetPassword = () =>
  useUsersMutation(({ id, password }: { id: string; password: string }) =>
    resetUserPassword(id, password),
  );
export const useDeleteUser = () => useUsersMutation(deleteUser);
