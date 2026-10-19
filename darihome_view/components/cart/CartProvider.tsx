'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  CART_STORAGE_KEY,
  cartCount,
  cartSubtotal,
  type CartItem,
  type CartItemInput,
} from '@/lib/cart';

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  add: (item: CartItemInput, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function readStored(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Defensive: only keep well-formed entries.
    return parsed.filter(
      (i): i is CartItem =>
        !!i &&
        typeof i === 'object' &&
        typeof (i as CartItem).slug === 'string' &&
        typeof (i as CartItem).price === 'number' &&
        typeof (i as CartItem).qty === 'number',
    );
  } catch {
    return [];
  }
}

/**
 * Client-side cart (localStorage). There is no cart backend yet, so line items
 * live in the browser. Persists across reloads and syncs across tabs.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setItems(readStored());
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY) setItems(readStored());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const add = useCallback(
    (item: CartItemInput, qty = 1) => {
      setItems((current) => {
        const amount = Math.max(1, qty);
        const existing = current.find((i) => i.slug === item.slug);
        const next = existing
          ? current.map((i) =>
              i.slug === item.slug
                ? { ...i, qty: Math.min(99, i.qty + amount) }
                : i,
            )
          : [...current, { ...item, qty: Math.min(99, amount) }];
        window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
      setIsOpen(true);
    },
    [],
  );

  const setQty = useCallback(
    (slug: string, qty: number) => {
      setItems((current) => {
        const clamped = Math.max(1, Math.min(99, qty));
        const next = current.map((i) =>
          i.slug === slug ? { ...i, qty: clamped } : i,
        );
        window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const remove = useCallback((slug: string) => {
    setItems((current) => {
      const next = current.filter((i) => i.slug !== slug);
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    window.localStorage.removeItem(CART_STORAGE_KEY);
  }, []);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: cartCount(items),
      subtotal: cartSubtotal(items),
      isOpen,
      add,
      setQty,
      remove,
      clear,
      open,
      close,
    }),
    [items, isOpen, add, setQty, remove, clear, open, close],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
