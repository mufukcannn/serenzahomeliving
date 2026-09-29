"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { Product } from "@/lib/products";
import { useCart } from "@/components/cart-provider";

export function AddToCart({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [color, setColor] = useState(product.colors[0]);
  const [size, setSize] = useState(product.sizes[0]);

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-ink/45">Renk</p>
        <div className="flex flex-wrap gap-2">
          {product.colors.map((item) => (
            <button
              key={item}
              onClick={() => setColor(item)}
              className={`border px-4 py-2 text-sm ${color === item ? "border-ink bg-ink text-white" : "border-ink/15 bg-white"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-ink/45">Ölçü</p>
        <div className="flex flex-wrap gap-2">
          {product.sizes.map((item) => (
            <button
              key={item}
              onClick={() => setSize(item)}
              className={`border px-4 py-2 text-sm ${size === item ? "border-ink bg-ink text-white" : "border-ink/15 bg-white"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={() => addItem(product, { color, size })}
        className="inline-flex w-full items-center justify-center gap-3 bg-ink px-6 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-white"
      >
        <ShoppingBag size={18} />
        Sepete Ekle
      </button>
    </div>
  );
}
