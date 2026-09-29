import { NextResponse } from "next/server";
import { CarrierProvider, ShipmentStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCarrierAdapter } from "@/services/logistics";
import { notificationService } from "@/services/notifications";

const shipmentSchema = z.object({
  orderId: z.string(),
  carrier: z.enum(["manual", "yurtici"]).default("manual"),
  trackingCode: z.string().optional(),
  trackingUrl: z.string().optional()
});

export async function POST(request: Request) {
  const input = shipmentSchema.parse(await request.json());
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: { items: true, shipment: true }
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const customer = order.customerSnapshot as { firstName?: string; lastName?: string; email?: string; phone?: string };
  const address = order.addressSnapshot as { fullName?: string; phone?: string; city?: string; district?: string; line1?: string };
  const adapter = getCarrierAdapter(input.carrier);
  const label = await adapter.createShipment({
    orderId: order.id,
    orderNumber: order.orderNumber,
    carrier: input.carrier,
    recipient: {
      fullName: address.fullName ?? `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim(),
      phone: address.phone ?? customer.phone,
      city: address.city ?? "",
      district: address.district ?? "",
      address: address.line1 ?? ""
    },
    lines: order.items.map((item) => ({
      productId: item.productId,
      title: item.title,
      quantity: item.quantity,
      size: item.size ?? undefined,
      unitPrice: Number(item.unitPrice)
    })),
    manual: {
      trackingCode: input.trackingCode,
      trackingUrl: input.trackingUrl
    }
  });

  const shipment = await prisma.shipment.upsert({
    where: { orderId: order.id },
    update: {
      provider: label.provider as CarrierProvider,
      carrier: label.carrier,
      trackingCode: label.trackingCode,
      trackingUrl: label.trackingUrl,
      labelUrl: label.labelUrl,
      shipmentStatus: label.shipmentStatus,
      rawPayload: label.raw as object,
      statusHistory: [
        {
          status: label.shipmentStatus,
          timestamp: new Date().toISOString(),
          note: `${label.carrier} shipment created`
        }
      ]
    },
    create: {
      orderId: order.id,
      provider: label.provider as CarrierProvider,
      carrier: label.carrier,
      trackingCode: label.trackingCode,
      trackingUrl: label.trackingUrl,
      labelUrl: label.labelUrl,
      shipmentStatus: label.shipmentStatus,
      rawPayload: label.raw as object,
      statusHistory: [
        {
          status: label.shipmentStatus,
          timestamp: new Date().toISOString(),
          note: `${label.carrier} shipment created`
        }
      ]
    }
  });

  const orderStatus = label.shipmentStatus === "label_created" || label.shipmentStatus === "in_transit" ? "shipped" : order.orderStatus;
  await prisma.order.update({ where: { id: order.id }, data: { orderStatus } });
  await notificationService.sendShipmentCreated({
    orderNumber: order.orderNumber,
    customer: {
      name: `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim(),
      email: customer.email,
      phone: customer.phone
    },
    carrier: shipment.carrier ?? undefined,
    trackingCode: shipment.trackingCode ?? undefined,
    trackingUrl: shipment.trackingUrl ?? undefined
  });

  return NextResponse.json({ shipment });
}

export async function PATCH(request: Request) {
  const input = z.object({ orderId: z.string(), shipmentStatus: z.nativeEnum(ShipmentStatus) }).parse(await request.json());
  const shipment = await prisma.shipment.update({
    where: { orderId: input.orderId },
    data: {
      shipmentStatus: input.shipmentStatus,
      lastSyncedAt: new Date(),
      deliveredAt: input.shipmentStatus === "delivered" ? new Date() : undefined,
      shippedAt: input.shipmentStatus === "in_transit" ? new Date() : undefined
    },
    include: { order: true }
  });
  await prisma.order.update({
    where: { id: input.orderId },
    data: { orderStatus: input.shipmentStatus === "delivered" ? "delivered" : input.shipmentStatus === "in_transit" ? "shipped" : undefined }
  });
  return NextResponse.json({ shipment });
}
