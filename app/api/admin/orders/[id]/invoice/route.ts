import { NextResponse } from "next/server";
import { z } from "zod";
import { invoiceService } from "@/services/invoices";

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(2),
  invoiceUrl: z.string().url()
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const input = invoiceSchema.parse(await request.json());
  const order = await invoiceService.updateManualInvoice({
    orderId: params.id,
    invoiceNumber: input.invoiceNumber,
    invoiceUrl: input.invoiceUrl
  });

  return NextResponse.json({ order });
}
