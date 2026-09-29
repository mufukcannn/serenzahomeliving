import { Product, getProductFinalPrice } from "@/lib/products";

export type AnalyticsItem = {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_variant?: string;
  price: number;
  quantity: number;
};

export type EcommerceEvent = {
  eventName: "view_item" | "add_to_cart" | "begin_checkout" | "add_payment_info" | "purchase";
  eventId?: string;
  value: number;
  currency?: "TRY";
  items: AnalyticsItem[];
  orderId?: string;
  customer?: {
    email?: string;
    phone?: string;
  };
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    ttq?: {
      track?: (event: string, data?: Record<string, unknown>) => void;
    };
  }
}

export function productToAnalyticsItem(product: Product, options?: { quantity?: number; size?: string; color?: string }): AnalyticsItem {
  return {
    item_id: product.sku,
    item_name: product.title,
    item_category: product.category,
    item_variant: [options?.size, options?.color].filter(Boolean).join(" / ") || undefined,
    price: getProductFinalPrice(product),
    quantity: options?.quantity ?? 1
  };
}

export function trackEcommerceEvent(event: EcommerceEvent) {
  const eventId = event.eventId ?? createEventId(event.eventName);
  const currency = event.currency ?? "TRY";
  const gaPayload = {
    currency,
    value: event.value,
    transaction_id: event.orderId,
    items: event.items,
    ecomm_prodid: event.items.map((item) => item.item_id),
    ecomm_pagetype: mapRemarketingPageType(event.eventName),
    ecomm_totalvalue: event.value
  };

  window.gtag?.("event", event.eventName, gaPayload);

  if (event.eventName === "add_to_cart") {
    window.fbq?.("track", "AddToCart", toMetaPayload(event, eventId));
    window.ttq?.track?.("AddToCart", toTikTokPayload(event));
  }

  if (event.eventName === "begin_checkout") {
    window.fbq?.("track", "InitiateCheckout", toMetaPayload(event, eventId));
    window.ttq?.track?.("InitiateCheckout", toTikTokPayload(event));
  }

  if (event.eventName === "add_payment_info") {
    window.fbq?.("track", "AddPaymentInfo", toMetaPayload(event, eventId));
    window.ttq?.track?.("AddPaymentInfo", toTikTokPayload(event));
  }

  if (event.eventName === "purchase") {
    window.fbq?.("track", "Purchase", toMetaPayload(event, eventId));
    window.ttq?.track?.("CompletePayment", toTikTokPayload(event));
  }

  sendServerConversion({ ...event, eventId }).catch(() => undefined);
}

function toMetaPayload(event: EcommerceEvent, eventId: string) {
  return {
    content_ids: event.items.map((item) => item.item_id),
    content_name: event.items.map((item) => item.item_name).join(", "),
    content_type: "product",
    contents: event.items.map((item) => ({
      id: item.item_id,
      quantity: item.quantity,
      item_price: item.price
    })),
    currency: event.currency ?? "TRY",
    value: event.value,
    eventID: eventId
  };
}

function toTikTokPayload(event: EcommerceEvent) {
  return {
    content_type: "product",
    contents: event.items.map((item) => ({
      content_id: item.item_id,
      content_name: item.item_name,
      quantity: item.quantity,
      price: item.price
    })),
    currency: event.currency ?? "TRY",
    value: event.value
  };
}

async function sendServerConversion(event: EcommerceEvent) {
  if (!["add_to_cart", "begin_checkout", "purchase"].includes(event.eventName)) return;
  await fetch("/api/marketing/conversions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify(event)
  });
}

function createEventId(name: string) {
  return `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function mapRemarketingPageType(name: EcommerceEvent["eventName"]) {
  if (name === "view_item") return "product";
  if (name === "add_to_cart") return "cart";
  if (name === "begin_checkout" || name === "add_payment_info") return "checkout";
  if (name === "purchase") return "purchase";
  return "other";
}
