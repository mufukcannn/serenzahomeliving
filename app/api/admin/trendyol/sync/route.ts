import { NextResponse } from "next/server";
import { z } from "zod";
import { trendyolProductImportService } from "@/services/marketplaces/trendyol-import";

const syncSchema = z.object({
  type: z.enum(["stock", "price"]),
  barcodes: z.array(z.string()).optional()
});

export async function POST(request: Request) {
  try {
    const input = syncSchema.parse(await request.json());
    const result = input.type === "stock" ? await trendyolProductImportService.syncStock(input.barcodes) : await trendyolProductImportService.syncPrice(input.barcodes);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        updated: 0,
        error: error instanceof Error ? error.message : "Senkronizasyon tamamlanamadi."
      },
      { status: 500 }
    );
  }
}
