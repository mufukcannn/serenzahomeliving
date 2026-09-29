import { NextResponse } from "next/server";
import { z } from "zod";
import { sendMetaConversion } from "@/lib/marketing/server";

const conversionSchema = z.object({
  eventName: z.enum(["view_item", "add_to_cart", "begin_checkout", "add_payment_info", "purchase"]),
  eventId: z.string().optional(),
  value: z.number().nonnegative(),
  currency: z.literal("TRY").optional(),
  orderId: z.string().optional(),
  customer: z.object({ email: z.string().optional(), phone: z.string().optional() }).optional(),
  items: z.array(
    z.object({
      item_id: z.string(),
      item_name: z.string(),
      item_category: z.string().optional(),
      item_variant: z.string().optional(),
      price: z.number().nonnegative(),
      quantity: z.number().int().positive()
    })
  )
});

export async function POST(request: Request) {
  const input = conversionSchema.parse(await request.json());
  const meta = await sendMetaConversion({ ...input, currency: input.currency ?? "TRY", request });
  return NextResponse.json({ ok: true, meta });
}
