import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCarrierAdapter } from "@/services/logistics";
import { notificationService } from "@/services/notifications";

export async function POST() {
  const adapter = getCarrierAdapter("yurtici");
  const shipments = await prisma.shipment.findMany({
    where: {
      provider: "yurtici",
      trackingCode: { not: null },
      shipmentStatus: { in: ["label_created", "in_transit", "exception"] }
    },
    include: { order: true },
    take: 50
  });

  const updates = [];
  for (const shipment of shipments) {
    if (!shipment.trackingCode) continue;
    const result = await adapter.getTrackingStatus(shipment.trackingCode);
    const updated = await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        shipmentStatus: result.status,
        rawPayload: result.raw as object,
        lastSyncedAt: new Date(),
        shippedAt: result.status === "in_transit" ? new Date() : shipment.shippedAt,
        deliveredAt: result.status === "delivered" ? new Date() : shipment.deliveredAt
      }
    });
    if (result.status === "delivered") {
      await prisma.order.update({ where: { id: shipment.orderId }, data: { orderStatus: "delivered" } });
    } else if (result.status === "in_transit") {
      await prisma.order.update({ where: { id: shipment.orderId }, data: { orderStatus: "shipped" } });
    }
    const customer = shipment.order.customerSnapshot as { firstName?: string; lastName?: string; email?: string; phone?: string };
    await notificationService.sendShipmentStatusChanged({
      orderNumber: shipment.order.orderNumber,
      customer: {
        name: `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim(),
        email: customer.email,
        phone: customer.phone
      },
      carrier: shipment.carrier ?? undefined,
      trackingCode: shipment.trackingCode,
      trackingUrl: shipment.trackingUrl ?? undefined,
      status: result.status
    });
    updates.push(updated);
  }

  return NextResponse.json({ ok: true, synced: updates.length, updates });
}
