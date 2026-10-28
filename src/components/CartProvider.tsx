"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = {
  variantId: string;
  handle: string;
  title: string;
  variantTitle: string | null;
  price: number;
  image: string | null;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  ready: boolean;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  add: (line: Omit<CartLine, "quantity">, quantity: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "yana-cart-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setLines(JSON.parse(saved));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {}
  }, [lines, ready]);

  const add = useCallback<CartContextValue["add"]>((line, quantity) => {
    setLines((current) => {
      const existing = current.find((l) => l.variantId === line.variantId);
      if (existing) {
        return current.map((l) =>
          l.variantId === line.variantId ? { ...l, quantity: Math.min(99, l.quantity + quantity) } : l,
        );
      }
      return [...current, { ...line, quantity }];
    });
    setDrawerOpen(true);
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setLines((current) =>
      quantity <= 0
        ? current.filter((l) => l.variantId !== variantId)
        : current.map((l) => (l.variantId === variantId ? { ...l, quantity: Math.min(99, quantity) } : l)),
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(
    () => ({
      lines,
      ready,
      drawerOpen,
      setDrawerOpen,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      subtotal: lines.reduce((n, l) => n + l.price * l.quantity, 0),
      add,
      setQuantity,
      clear,
    }),
    [lines, ready, drawerOpen, add, setQuantity, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
