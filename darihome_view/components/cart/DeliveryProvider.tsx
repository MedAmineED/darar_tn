'use client';

import { createContext, useContext } from 'react';
import { DEFAULT_DELIVERY, type DeliverySettings } from '@/lib/delivery';

const DeliveryContext = createContext<DeliverySettings>(DEFAULT_DELIVERY);

/** Feeds server-fetched delivery pricing to the client cart/checkout. */
export function DeliveryProvider({
  value,
  children,
}: {
  value: DeliverySettings;
  children: React.ReactNode;
}) {
  return (
    <DeliveryContext.Provider value={value}>
      {children}
    </DeliveryContext.Provider>
  );
}

export function useDelivery(): DeliverySettings {
  return useContext(DeliveryContext);
}
