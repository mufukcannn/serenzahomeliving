import { NextRequest, NextResponse } from "next/server";
import { getAdminOrderWithShippingState, updateShippingState } from "@/lib/admin-shipping-store";
import { getOrderDetailAccess, parseAdminRole } from "@/lib/admin-access";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const body = (await request.json().catch(() => ({}))) as { role?: string };
  const access = getOrderDetailAccess(parseAdminRole(body.role ?? request.nextUrl.searchParams.get("role")));
  if (!access.canMarkShipped) return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });

  const order = getAdminOrderWithShippingState(params.id);
  if (!order) return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });

  const shippedAt = new Date().toLocaleString("tr-TR");
  const updated = updateShippingState(order.id, {
    orderStatus: "shipped",
    shipmentStatus: "in_transit",
    shippedAt
  });

  return NextResponse.json({ ok: true, message: "Sipariş kargolandı olarak işaretlendi.", order: updated });
}
