import { apiClient, unwrap } from './client';
import type { ApiSuccess } from './types';

export interface DeliverySettings {
  fee: number;
  freeShippingThreshold: number;
}

export async function getDeliverySettings(): Promise<DeliverySettings> {
  const res =
    await apiClient.get<ApiSuccess<DeliverySettings>>('/settings/delivery');
  return unwrap(res);
}

export async function updateDeliverySettings(
  input: DeliverySettings,
): Promise<DeliverySettings> {
  const res = await apiClient.put<ApiSuccess<DeliverySettings>>(
    '/settings/delivery',
    input,
  );
  return unwrap(res);
}
