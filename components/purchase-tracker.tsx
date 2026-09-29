"use client";

import { useEffect } from "react";
import type { AnalyticsItem } from "@/lib/analytics";
import { trackEcommerceEvent } from "@/lib/analytics";

export function PurchaseTracker({
  orderId,
  orderNumber,
  value
}: {
  orderId?: string;
  orderNumber?: string;
  value?: number;
}) {
  useEffect(() => {
    if (!orderId && !orderNumber) return;
    const storageKey = `serenza-purchase-${orderId ?? orderNumber}`;
    if (window.sessionStorage.getItem(storageKey)) return;
    const checkout = readLastCheckout();
    window.sessionStorage.setItem(storageKey, "tracked");
    trackEcommerceEvent({
      eventName: "purchase",
      eventId: `purchase-${orderId ?? orderNumber}`,
      orderId: orderId ?? orderNumber,
      value: value ?? checkout?.value ?? 0,
      items: checkout?.items ?? []
    });
  }, [orderId, orderNumber, value]);

  return null;
}

function readLastCheckout(): { value: number; items: AnalyticsItem[] } | null {
  try {
    const stored = window.sessionStorage.getItem("serenza-last-checkout");
    return stored ? (JSON.parse(stored) as { value: number; items: AnalyticsItem[] }) : null;
  } catch {
    return null;
  }
}
