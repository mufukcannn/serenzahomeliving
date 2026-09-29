import { NextResponse } from "next/server";
import { getAdminOrdersFromDatabase } from "@/lib/admin-orders";

export const dynamic = "force-dynamic";

export async function GET() {
  const orders = await getAdminOrdersFromDatabase();
  return NextResponse.json({ orders });
}
