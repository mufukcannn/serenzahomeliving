import { NextRequest, NextResponse } from "next/server";
import { getAdminOrderWithShippingState, shippingUsers, updateShippingState } from "@/lib/admin-shipping-store";
import { getOrderDetailAccess, parseAdminRole } from "@/lib/admin-access";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const body = (await request.json().catch(() => ({}))) as { role?: string; assignedUserId?: string };
  const role = parseAdminRole(body.role ?? request.nextUrl.searchParams.get("role"));
  const access = getOrderDetailAccess(role);
  if (access.role !== "admin") return NextResponse.json({ error: "Sevkiyat ataması için Admin yetkisi gerekir." }, { status: 403 });

  const order = getAdminOrderWithShippingState(params.id);
  if (!order) return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });

  const user = shippingUsers.find((item) => item.id === body.assignedUserId);
  if (!user) return NextResponse.json({ error: "Geçerli bir sevkiyat personeli seçin." }, { status: 400 });

  const updated = updateShippingState(order.id, {
    assignedUserId: user.id,
    assignedTo: user.name
  });

  return NextResponse.json({ ok: true, message: `${user.name} sevkiyata atandı.`, order: updated, users: shippingUsers });
}
