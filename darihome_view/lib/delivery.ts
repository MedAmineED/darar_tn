/**
 * Client-safe mirror of the server's delivery pricing rule. The server is the
 * source of truth for what an order is charged; this only powers the live
 * cart/checkout display so the customer sees the same math before submitting.
 */
export interface DeliverySettings {
  fee: number;
  freeShippingThreshold: number;
}

export const DEFAULT_DELIVERY: DeliverySettings = {
  fee: 0,
  freeShippingThreshold: 0,
};

/** Delivery cost for a subtotal: free at/above the threshold, else the flat fee. */
export function deliveryFeeFor(
  subtotal: number,
  { fee, freeShippingThreshold }: DeliverySettings,
): number {
  if (freeShippingThreshold > 0 && subtotal >= freeShippingThreshold) return 0;
  return fee;
}
