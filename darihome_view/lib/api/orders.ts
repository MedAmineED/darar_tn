import 'server-only';
import { apiPost } from './client';

export interface CheckoutItem {
  slug: string;
  quantity: number;
}

export interface CheckoutPayload {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  notes?: string;
  items: CheckoutItem[];
  packs: CheckoutItem[];
}

export interface OrderConfirmation {
  orderNumber: string;
  status: string;
  subtotal: number;
  shippingAmount: number;
  totalAmount: number;
  itemCount: number;
}

export function createStorefrontOrder(
  payload: CheckoutPayload,
): Promise<OrderConfirmation> {
  return apiPost<OrderConfirmation>('/storefront/orders', payload);
}
