import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getDeliverySettings,
  updateDeliverySettings,
  type DeliverySettings,
} from '@/lib/api/settings';

const KEY = 'settings';

export function useDeliverySettings() {
  return useQuery({ queryKey: [KEY, 'delivery'], queryFn: getDeliverySettings });
}

export function useUpdateDeliverySettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DeliverySettings) => updateDeliverySettings(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
