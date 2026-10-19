import { apiClient, unwrap } from './client';
import type { ApiSuccess, Paginated } from './types';
import type {
  Customer,
  CustomerDetail,
  CustomerInput,
} from './commerce-types';

export async function listCustomers(params: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<Paginated<Customer>> {
  const res = await apiClient.get<ApiSuccess<Paginated<Customer>>>(
    '/customers',
    { params },
  );
  return unwrap(res);
}

export async function getCustomer(id: string): Promise<CustomerDetail> {
  const res = await apiClient.get<ApiSuccess<CustomerDetail>>(
    `/customers/${id}`,
  );
  return unwrap(res);
}

export async function createCustomer(
  input: CustomerInput,
): Promise<Customer> {
  const res = await apiClient.post<ApiSuccess<Customer>>('/customers', input);
  return unwrap(res);
}

export async function updateCustomer(
  id: string,
  input: Partial<CustomerInput>,
): Promise<Customer> {
  const res = await apiClient.patch<ApiSuccess<Customer>>(
    `/customers/${id}`,
    input,
  );
  return unwrap(res);
}

export async function deleteCustomer(id: string): Promise<void> {
  await apiClient.delete(`/customers/${id}`);
}
