import { NextResponse } from "next/server";
import { buildMetaCatalogXml } from "@/services/feeds";

export const dynamic = "force-dynamic";

export async function GET() {
  const feed = await buildMetaCatalogXml();
  return new NextResponse(feed.trim(), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=1800, stale-while-revalidate=3600"
    }
  });
}
