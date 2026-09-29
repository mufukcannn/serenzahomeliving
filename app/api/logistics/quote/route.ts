import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateShippingQuote } from "@/services/logistics";

const quoteSchema = z.object({
  carrier: z.enum(["manual", "yurtici"]).optional(),
  items: z.array(
    z.object({
      productId: z.string(),
      title: z.string(),
      quantity: z.number().int().positive(),
      size: z.string().optional(),
      unitPrice: z.number().nonnegative()
    })
  )
});

export async function POST(request: Request) {
  const input = quoteSchema.parse(await request.json());
  return NextResponse.json({ quote: calculateShippingQuote(input.items, input.carrier ?? "yurtici") });
}
