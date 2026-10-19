import { apiClient, unwrap } from './client';
import type { ApiSuccess, AuthSession, AuthUser } from './types';

export async function login(
  email: string,
  password: string,
): Promise<AuthSession> {
  const res = await apiClient.post<ApiSuccess<AuthSession>>('/auth/login', {
    email,
    password,
  });
  return unwrap(res);
}

export async function refreshSession(): Promise<AuthSession> {
  const res = await apiClient.post<ApiSuccess<AuthSession>>('/auth/refresh', {});
  return unwrap(res);
}

export async function fetchMe(): Promise<AuthUser> {
  const res = await apiClient.get<ApiSuccess<AuthUser>>('/auth/me');
  return unwrap(res);
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout', {});
}
