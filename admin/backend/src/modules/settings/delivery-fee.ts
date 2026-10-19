/** Admin-configured delivery pricing (flat fee, waived over a threshold). */
export interface DeliverySettings {
  /** Flat delivery fee applied to an order, in the store currency. */
  fee: number;
  /** Subtotal at/above which delivery is free. 0 disables free shipping. */
  freeShippingThreshold: number;
}

/**
 * The single source of truth for what delivery costs a given order. Free at or
 * above the threshold (when one is set); otherwise the flat fee. Callers pass a
 * server-computed subtotal — delivery cost is never taken from the client.
 */
export function deliveryFeeFor(
  subtotal: number,
  settings: DeliverySettings,
): number {
  const { fee, freeShippingThreshold } = settings;
  if (freeShippingThreshold > 0 && subtotal >= freeShippingThreshold) {
    return 0;
  }
  return fee;
}
