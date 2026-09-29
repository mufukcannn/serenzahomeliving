import { NextResponse } from "next/server";
import { PaymentProvider } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/lib/payments";
import { sendMetaConversion } from "@/lib/marketing/server";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { notificationService } from "@/services/notifications";

export async function POST(request: Request, { params }: { params: { provider: string } }) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`payment-webhook:${params.provider}:${ip}`, 60, 60_000);
  if (!rateLimit.allowed) return new Response(params.provider === "paytr" ? "FAIL" : "rate_limited", { status: 429 });

  const contentType = request.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await request.json()
    : Object.fromEntries((await request.formData()).entries());
  const provider = getPaymentProvider(params.provider);
  const rawPaymentPayload = extractPaymentPayload(payload);
  let result;
  try {
    result = await provider.verifyWebhook(payload, request.headers);
  } catch (error) {
    await prisma.paymentLog.create({
      data: {
        orderId: rawPaymentPayload.orderId,
        provider: provider.name as PaymentProvider,
        eventType: "webhook_verification_failed",
        status: "failed",
        providerRef: rawPaymentPayload.providerRef,
        merchantOid: rawPaymentPayload.merchantOid,
        amount: rawPaymentPayload.amount,
        ipAddress: ip,
        userAgent: request.headers.get("user-agent") ?? undefined,
        hashVerified: false,
        errorMessage: error instanceof Error ? error.message : "Webhook verification failed",
        rawPayload: payload as object
      }
    }).catch(() => null);
    return new Response(params.provider === "paytr" ? "FAIL" : "verification_failed", { status: 400 });
  }

  const orderStatus = result.status === "paid" ? "processing" : result.status === "failed" ? "cancelled" : "created";

  try {
    let duplicateCallback = false;
    const order = await prisma.$transaction(async (tx) => {
      const existing = await tx.payment.findFirst({
        where: {
          provider: provider.name as PaymentProvider,
          providerRef: result.providerRef ?? result.orderId,
          status: "paid"
        }
      });
      const duplicate = Boolean(existing && result.status === "paid");
      duplicateCallback = duplicate;
      const orderForInventory = await tx.order.findUnique({
        where: { id: result.orderId },
        include: { reservations: true }
      });
      if (!orderForInventory) throw new Error("Order not found");

      const expectedAmount = Number(orderForInventory.total);
      const amountMatches = !result.amount || Math.round(result.amount * 100) === Math.round(expectedAmount * 100);

      await tx.paymentLog.create({
        data: {
          orderId: result.orderId,
          paymentId: existing?.id,
          provider: provider.name as PaymentProvider,
          eventType: "webhook_received",
          status: result.status,
          providerRef: result.providerRef ?? result.orderId,
          merchantOid: result.orderId,
          amount: result.amount,
          ipAddress: ip,
          userAgent: request.headers.get("user-agent") ?? undefined,
          hashVerified: true,
          duplicate,
          errorMessage: amountMatches ? result.failureReason : "PayTR amount mismatch",
          rawPayload: result.raw as object
        }
      });

      if (!amountMatches) throw new Error("PayTR amount mismatch");

      if (duplicate) {
        return orderForInventory;
      }

      const activeReservations = orderForInventory.reservations.filter((reservation) => reservation.status === "active");

      if (result.status === "paid") {
        for (const reservation of activeReservations) {
          await tx.$queryRaw`SELECT id FROM "Inventory" WHERE id = ${reservation.inventoryId} FOR UPDATE`;
          await tx.inventory.update({
            where: { id: reservation.inventoryId },
            data: {
              onHand: { decrement: reservation.quantity },
              reserved: { decrement: reservation.quantity }
            }
          });
          await tx.inventoryReservation.update({
            where: { id: reservation.id },
            data: { status: "committed", committedAt: result.paidAt ?? new Date() }
          });
        }
      }

      if (result.status === "failed") {
        for (const reservation of activeReservations) {
          await tx.$queryRaw`SELECT id FROM "Inventory" WHERE id = ${reservation.inventoryId} FOR UPDATE`;
          await tx.inventory.update({
            where: { id: reservation.inventoryId },
            data: { reserved: { decrement: reservation.quantity } }
          });
          await tx.inventoryReservation.update({
            where: { id: reservation.id },
            data: { status: "released", releasedAt: new Date() }
          });
        }
      }

      return tx.order.update({
        where: { id: result.orderId },
        data: {
          paymentStatus: result.status,
          orderStatus,
          payments: {
            upsert: {
              where: {
                provider_providerRef: {
                  provider: provider.name as PaymentProvider,
                  providerRef: result.providerRef ?? result.orderId
                }
              },
              update: {
                sessionId: result.sessionId,
                status: result.status,
                amount: result.amount ?? expectedAmount,
                rawPayload: result.raw as object,
                gatewayStatus: result.gatewayStatus,
                failureReason: result.failureReason,
                paidAt: result.status === "paid" ? result.paidAt ?? new Date() : undefined,
                failedAt: result.status === "failed" ? new Date() : undefined
              },
              create: {
                provider: provider.name as PaymentProvider,
                providerRef: result.providerRef ?? result.orderId,
                sessionId: result.sessionId,
                status: result.status,
                amount: result.amount ?? expectedAmount,
                rawPayload: result.raw as object,
                gatewayStatus: result.gatewayStatus,
                failureReason: result.failureReason,
                paidAt: result.status === "paid" ? result.paidAt ?? new Date() : undefined,
                failedAt: result.status === "failed" ? new Date() : undefined
              }
            }
          }
        }
      });
    });
    if (result.status === "paid" && !duplicateCallback) {
      const orderWithItems = await prisma.order.findUnique({ where: { id: result.orderId }, include: { items: true } });
      const customer = orderWithItems?.customerSnapshot as { name?: string; firstName?: string; lastName?: string; email?: string; phone?: string } | undefined;
      if (orderWithItems) {
        const customerName = customer?.name ?? ([customer?.firstName, customer?.lastName].filter(Boolean).join(" ") || "Müşteri");
        try {
          const notification = await notificationService.sendOrderReceived({
            orderNumber: orderWithItems.orderNumber,
            customer: {
              name: customerName,
              email: customer?.email
            },
            total: Number(orderWithItems.total),
            currency: "TL"
          });
          await prisma.paymentLog.create({
            data: {
              orderId: orderWithItems.id,
              provider: provider.name as PaymentProvider,
              eventType: "order_received_email_sent",
              status: "paid",
              providerRef: result.providerRef ?? result.orderId,
              merchantOid: result.orderId,
              amount: Number(orderWithItems.total),
              rawPayload: notification as object
            }
          });
        } catch (notificationError) {
          await prisma.paymentLog.create({
            data: {
              orderId: orderWithItems.id,
              provider: provider.name as PaymentProvider,
              eventType: "order_received_email_failed",
              status: "failed",
              providerRef: result.providerRef ?? result.orderId,
              merchantOid: result.orderId,
              amount: Number(orderWithItems.total),
              errorMessage: notificationError instanceof Error ? notificationError.message : "Order notification failed"
            }
          });
        }
        await sendMetaConversion({
          eventName: "purchase",
          eventId: `purchase-${orderWithItems.id}`,
          orderId: orderWithItems.id,
          value: Number(orderWithItems.total),
          currency: "TRY",
          customer,
          items: orderWithItems.items.map((item) => ({
            item_id: item.sku,
            item_name: item.title,
            item_variant: [item.size, item.color].filter(Boolean).join(" / ") || undefined,
            price: Number(item.unitPrice),
            quantity: item.quantity
          })),
          request
        });
      }
    }
    if (params.provider === "paytr") return new Response("OK");
    return NextResponse.json({ ok: true, order });
  } catch (error) {
    await prisma.paymentLog.create({
      data: {
        orderId: result.orderId,
        provider: provider.name as PaymentProvider,
        eventType: "webhook_processing_failed",
        status: "failed",
        providerRef: result.providerRef ?? result.orderId,
        merchantOid: result.orderId,
        amount: result.amount,
        ipAddress: ip,
        userAgent: request.headers.get("user-agent") ?? undefined,
        hashVerified: true,
        errorMessage: error instanceof Error ? error.message : "Webhook processing failed",
        rawPayload: result.raw as object
      }
    }).catch(() => null);
    if (params.provider === "paytr") return new Response("FAIL", { status: 500 });
    return NextResponse.json({ ok: true, demoMode: true, result, warning: String(error) });
  }
}

function extractPaymentPayload(payload: unknown) {
  const data = payload as {
    merchant_oid?: string;
    orderId?: string;
    providerRef?: string;
    total_amount?: string;
    payment_amount?: string;
    amount?: string | number;
  };
  const amountRaw = data.total_amount ?? data.payment_amount ?? data.amount;
  const numericAmount =
    typeof amountRaw === "number"
      ? amountRaw
      : amountRaw
        ? Number(amountRaw) / (String(amountRaw).includes(".") ? 1 : 100)
        : undefined;
  return {
    orderId: data.merchant_oid ?? data.orderId,
    providerRef: data.providerRef ?? data.merchant_oid ?? data.orderId,
    merchantOid: data.merchant_oid ?? data.orderId,
    amount: Number.isFinite(numericAmount) ? numericAmount : undefined
  };
}
