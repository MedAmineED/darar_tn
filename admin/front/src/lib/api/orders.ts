import { apiClient, unwrap } from './client';
import type { ApiSuccess, Paginated } from './types';
import type {
  CreateOrderInput,
  Order,
  OrderListItem,
  OrderListParams,
  UpdateOrderInput,
} from './commerce-types';

export async function listOrders(
  params: OrderListParams,
): Promise<Paginated<OrderListItem>> {
  const res = await apiClient.get<ApiSuccess<Paginated<OrderListItem>>>(
    '/orders',
    { params },
  );
  return unwrap(res);
}

export async function getOrder(id: string): Promise<Order> {
  const res = await apiClient.get<ApiSuccess<Order>>(`/orders/${id}`);
  return unwrap(res);
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const { requestKey, ...body } = input;
  const res = await apiClient.post<ApiSuccess<Order>>('/orders', body, {
    headers: requestKey ? { 'Idempotency-Key': requestKey } : undefined,
  });
  return unwrap(res);
}

export async function updateOrder(
  id: string,
  input: UpdateOrderInput,
): Promise<Order> {
  const res = await apiClient.patch<ApiSuccess<Order>>(`/orders/${id}`, input);
  return unwrap(res);
}
