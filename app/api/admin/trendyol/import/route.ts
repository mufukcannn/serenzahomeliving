import { NextResponse } from "next/server";
import { z } from "zod";
import { trendyolProductImportService } from "@/services/marketplaces/trendyol-import";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 0);
    const size = Number(url.searchParams.get("size") ?? 50);
    const approved = url.searchParams.has("approved") ? url.searchParams.get("approved") === "true" : undefined;
    const preview = await trendyolProductImportService.previewProducts({ page, size, approved });
    return NextResponse.json(preview);
  } catch (error) {
    return NextResponse.json(
      {
        products: [],
        page: 0,
        size: 0,
        error: error instanceof Error ? error.message : "Trendyol urunleri cekilemedi."
      },
      { status: 502 }
    );
  }
}

const importSchema = z.object({
  products: z.array(
    z.object({
      id: z.union([z.string(), z.number()]).optional(),
      title: z.string(),
      barcode: z.string(),
      stockCode: z.string().optional(),
      quantity: z.number(),
      salePrice: z.number(),
      listPrice: z.number(),
      categoryName: z.string(),
      brand: z.string().optional(),
      description: z.string().optional(),
      images: z.array(z.string()),
      attributes: z.array(z.object({ name: z.string(), value: z.string() })),
      status: z.enum(["active", "draft", "archived"]),
      trendyolUrl: z.string().optional(),
      raw: z.unknown().optional()
    })
  )
});

export async function POST(request: Request) {
  try {
    const input = importSchema.parse(await request.json());
    const result = await trendyolProductImportService.importProducts(input.products);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        imported: 0,
        skipped: 0,
        products: [],
        error: error instanceof Error ? error.message : "Urunler ice aktarilamadi."
      },
      { status: 500 }
    );
  }
}
