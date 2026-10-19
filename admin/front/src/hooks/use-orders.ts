import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createOrder,
  getOrder,
  listOrders,
  updateOrder,
} from '@/lib/api/orders';
import type {
  CreateOrderInput,
  OrderListParams,
  UpdateOrderInput,
} from '@/lib/api/commerce-types';

const KEY = 'orders';

export function useOrders(params: OrderListParams) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => listOrders(params),
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, 'detail', id],
    queryFn: () => getOrder(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrderInput) => createOrder(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateOrderInput }) =>
      updateOrder(id, input),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: [KEY, 'detail', id] });
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
