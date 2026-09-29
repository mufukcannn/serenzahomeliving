import { NextRequest, NextResponse } from "next/server";
import { buildShippingLabelPdf, getAdminOrderWithShippingState, updateShippingState } from "@/lib/admin-shipping-store";
import { getOrderDetailAccess, parseAdminRole } from "@/lib/admin-access";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const access = getOrderDetailAccess(parseAdminRole(request.nextUrl.searchParams.get("role")));
  if (!access.canPrintLabel) return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });

  const order = getAdminOrderWithShippingState(params.id);
  if (!order) return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  if (!order.shippingLabelUrl) return NextResponse.json({ error: "Önce etiket oluşturulmalı." }, { status: 404 });

  return new NextResponse(new Uint8Array(buildShippingLabelPdf(order)), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${order.orderNumber}-kargo-etiketi.pdf"`
    }
  });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const body = (await request.json().catch(() => ({}))) as { role?: string };
  const access = getOrderDetailAccess(parseAdminRole(body.role ?? request.nextUrl.searchParams.get("role")));
  if (!access.canPrintLabel) return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });

  const order = getAdminOrderWithShippingState(params.id);
  if (!order) return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });

  const labelUrl = `/api/admin/orders/${order.id}/shipping/label?role=${access.role}`;
  const updated = updateShippingState(order.id, {
    shippingLabelUrl: labelUrl,
    shipmentStatus: order.shipmentStatus === "not_ready" ? "label_created" : order.shipmentStatus
  });

  return NextResponse.json({
    ok: true,
    message: "Kargo etiketi oluşturuldu.",
    labelUrl,
    order: updated
  });
}
