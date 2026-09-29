"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { productToAnalyticsItem, trackEcommerceEvent } from "@/lib/analytics";
import { Product, getProductFinalPrice } from "@/lib/products";

export type CartLine = {
  product: Product;
  quantity: number;
  color?: string;
  size?: string;
};

type CartContextValue = {
  items: CartLine[];
  total: number;
  shipping: number;
  grandTotal: number;
  count: number;
  addItem: (product: Product, options?: { color?: string; size?: string }) => void;
  updateQuantity: (lineKey: string, quantity: number) => void;
  removeItem: (lineKey: string) => void;
  clear: () => void;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const storageKey = "serenza-cart-v1";

export function getCartLineKey(line: CartLine) {
  return `${line.product.id}-${line.color ?? ""}-${line.size ?? ""}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) setItems(JSON.parse(stored) as CartLine[]);
    } catch {
      setItems([]);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [hydrated, items]);

  const value = useMemo<CartContextValue>(() => {
    const total = items.reduce((sum, line) => sum + getProductFinalPrice(line.product) * line.quantity, 0);
    const shipping = calculateCartShipping(items, total);
    const count = items.reduce((sum, line) => sum + line.quantity, 0);
    return {
      items,
      total,
      shipping,
      grandTotal: total + shipping,
      count,
      addItem(product, options) {
        const analyticsItem = productToAnalyticsItem(product, { quantity: 1, size: options?.size, color: options?.color });
        trackEcommerceEvent({
          eventName: "add_to_cart",
          value: analyticsItem.price,
          items: [analyticsItem]
        });
        setItems((current) => {
          const key = `${product.id}-${options?.color ?? ""}-${options?.size ?? ""}`;
          const existing = current.find((line) => getCartLineKey(line) === key);
          if (existing) {
            return current.map((line) => (getCartLineKey(line) === key ? { ...line, quantity: line.quantity + 1 } : line));
          }
          return [...current, { product, quantity: 1, color: options?.color, size: options?.size }];
        });
        setDrawerOpen(true);
      },
      updateQuantity(lineKey, quantity) {
        setItems((current) =>
          current
            .map((line) => (getCartLineKey(line) === lineKey ? { ...line, quantity: Math.max(1, quantity) } : line))
            .filter((line) => line.quantity > 0)
        );
      },
      removeItem(lineKey) {
        setItems((current) => current.filter((line) => getCartLineKey(line) !== lineKey));
      },
      clear() {
        setItems([]);
        setDrawerOpen(false);
      },
      drawerOpen,
      openDrawer() {
        setDrawerOpen(true);
      },
      closeDrawer() {
        setDrawerOpen(false);
      },
    };
  }, [drawerOpen, items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

function calculateCartShipping(items: CartLine[], total: number) {
  if (total <= 0) return 0;
  const largestArea = Math.max(0, ...items.map((line) => getSizeArea(line.size)));
  if (largestArea >= 8) return total >= 6000 ? 0 : 499;
  if (largestArea >= 4) return total >= 6000 ? 0 : 249;
  return total >= 1500 ? 0 : 149;
}

function getSizeArea(size?: string) {
  if (!size) return 0;
  const match = size.match(/(\d{2,3})\s*x\s*(\d{2,3})/i);
  if (!match) return 0;
  return (Number(match[1]) / 100) * (Number(match[2]) / 100);
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
