"use client";

import { useCart } from "@/components/cart-provider";

export function CartBadge() {
  const { count } = useCart();
  if (!count) return null;
  return (
    <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-clay px-1 text-[11px] font-semibold text-white">
      {count}
    </span>
  );
}
