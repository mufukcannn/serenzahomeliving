import crypto from "crypto";
import { EcommerceEvent } from "@/lib/analytics";

export type ServerConversionInput = EcommerceEvent & {
  request?: Request;
};

export async function sendMetaConversion(input: ServerConversionInput) {
  const pixelId = process.env.META_PIXEL_ID ?? process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_CONVERSIONS_ACCESS_TOKEN;
  if (!pixelId || !accessToken) {
    return { ok: true, skipped: true, reason: "Meta Conversion API env vars are not configured" };
  }

  const eventName = mapMetaEventName(input.eventName);
  const eventTime = Math.floor(Date.now() / 1000);
  const userData = {
    em: input.customer?.email ? hash(input.customer.email) : undefined,
    ph: input.customer?.phone ? hash(input.customer.phone) : undefined,
    client_ip_address: input.request?.headers.get("x-forwarded-for")?.split(",")[0],
    client_user_agent: input.request?.headers.get("user-agent") ?? undefined
  };

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: eventTime,
        event_id: input.eventId,
        action_source: "website",
        event_source_url: input.request?.url,
        user_data: removeUndefined(userData),
        custom_data: {
          currency: input.currency ?? "TRY",
          value: input.value,
          order_id: input.orderId,
          content_type: "product",
          content_ids: input.items.map((item) => item.item_id),
          contents: input.items.map((item) => ({
            id: item.item_id,
            quantity: item.quantity,
            item_price: item.price
          }))
        }
      }
    ]
  };

  const response = await fetch(`https://graph.facebook.com/v20.0/${pixelId}/events?access_token=${accessToken}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return { ok: response.ok, status: response.status, raw: await response.json().catch(() => null) };
}

function mapMetaEventName(name: EcommerceEvent["eventName"]) {
  if (name === "add_to_cart") return "AddToCart";
  if (name === "begin_checkout") return "InitiateCheckout";
  if (name === "add_payment_info") return "AddPaymentInfo";
  if (name === "purchase") return "Purchase";
  return "ViewContent";
}

function hash(value: string) {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function removeUndefined<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}
