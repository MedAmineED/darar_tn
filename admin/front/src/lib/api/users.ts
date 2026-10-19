import { apiClient, unwrap } from './client';
import type { ApiSuccess, Paginated } from './types';

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  roles: { id: string; name: string }[];
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  userCount: number;
}

export interface UserInput {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  isActive: boolean;
  roleIds: string[];
}

export async function listUsers(params: {
  page: number;
  limit: number;
  search?: string;
}): Promise<Paginated<AdminUser>> {
  return unwrap(
    await apiClient.get<ApiSuccess<Paginated<AdminUser>>>('/users', {
      params,
    }),
  );
}

export async function listRoles(): Promise<Role[]> {
  return unwrap(await apiClient.get<ApiSuccess<Role[]>>('/roles'));
}

export async function createUser(input: UserInput): Promise<AdminUser> {
  return unwrap(await apiClient.post<ApiSuccess<AdminUser>>('/users', input));
}

export async function updateUser(
  id: string,
  input: Partial<Omit<UserInput, 'password'>>,
): Promise<AdminUser> {
  return unwrap(
    await apiClient.patch<ApiSuccess<AdminUser>>(`/users/${id}`, input),
  );
}

export async function resetUserPassword(
  id: string,
  password: string,
): Promise<void> {
  await apiClient.patch(`/users/${id}/password`, { password });
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}
