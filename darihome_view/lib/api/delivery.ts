import 'server-only';
import { apiGet } from './client';
import { DEFAULT_DELIVERY, type DeliverySettings } from '../delivery';

/**
 * Public delivery pricing from the backend. Falls back to "free / no threshold"
 * if the settings endpoint is unreachable, so a settings outage never blocks
 * the storefront — the order is priced authoritatively server-side regardless.
 */
export async function getDeliverySettings(): Promise<DeliverySettings> {
  try {
    return await apiGet<DeliverySettings>('/storefront/delivery');
  } catch {
    return { ...DEFAULT_DELIVERY };
  }
}
