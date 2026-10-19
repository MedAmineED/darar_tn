import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/auth-provider';
import {
  adjustStock,
  listInventory,
  listStockMovements,
  updateStockThreshold,
  type InventoryParams,
  type MovementParams,
  type StockAdjustment,
  type ThresholdUpdate,
} from '@/lib/api/inventory';

export function useInventory(params: InventoryParams) {
  const { hasPermission } = useAuth();
  return useQuery({
    queryKey: ['inventory', params],
    queryFn: () => listInventory(params),
    enabled: hasPermission('inventory:read'),
  });
}
export function useStockMovements(productId: string, params: MovementParams) {
  const { hasPermission } = useAuth();
  return useQuery({
    queryKey: ['inventory', 'movements', productId, params],
    queryFn: () => listStockMovements(productId, params),
    enabled: Boolean(productId) && hasPermission('inventory:read'),
  });
}
function useRefreshStock() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all(
      ['inventory', 'dashboard', 'products', 'orders'].map((key) =>
        queryClient.invalidateQueries({ queryKey: [key] }),
      ),
    );
}
export function useAdjustStock() {
  const refresh = useRefreshStock();
  return useMutation({
    mutationFn: ({
      productId,
      input,
    }: {
      productId: string;
      input: StockAdjustment;
    }) => adjustStock(productId, input),
    onSuccess: refresh,
  });
}
export function useUpdateStockThreshold() {
  const refresh = useRefreshStock();
  return useMutation({
    mutationFn: ({
      productId,
      input,
    }: {
      productId: string;
      input: ThresholdUpdate;
    }) => updateStockThreshold(productId, input),
    onSuccess: refresh,
  });
}
