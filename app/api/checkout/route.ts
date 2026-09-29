import { NextResponse } from "next/server";
import { z } from "zod";
import { PaymentProvider as PrismaPaymentProvider } from "@prisma/client";
import { createWebsiteOrder } from "@/lib/orders";
import { createPaymentSessionWithFallback, normalizePaymentProvider } from "@/lib/payments";
import type { PaymentRequest } from "@/lib/payments/types";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

const checkoutSchema = z.object({
  customer: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional()
  }),
  address: z.object({
    line1: z.string().min(5),
    district: z.string().min(2),
    city: z.string().min(2),
    postalCode: z.string().optional(),
    billingType: z.enum(["individual", "corporate"]).optional(),
    taxOffice: z.string().optional(),
    taxNumber: z.string().optional()
  }),
  invoice: z.object({
    type: z.enum(["individual", "corporate"]),
    billingSameAsShipping: z.boolean(),
    billingName: z.string().optional(),
    billingCompany: z.string().optional(),
    billingTaxNumber: z.string().optional(),
    billingTaxOffice: z.string().optional(),
    billingAddress: z.string().min(5)
  }),
  paymentProvider: z.enum(["paytr"]).optional(),
  installment: z.number().int().min(1).max(12).optional(),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
      color: z.string().optional(),
      size: z.string().optional()
    })
  )
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`checkout:${ip}`, 12, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Çok fazla ödeme denemesi. Lütfen biraz sonra tekrar deneyin." }, { status: 429 });
  }

  const input = checkoutSchema.parse(await request.json());
  const providerName = normalizePaymentProvider(input.paymentProvider ?? "paytr");
  let createdOrderId: string | undefined;

  try {
    const billingAddress = input.invoice.billingSameAsShipping
      ? input.address
      : {
          line1: input.invoice.billingAddress,
          district: input.address.district,
          city: input.address.city,
          billingType: input.invoice.type,
          taxOffice: input.invoice.billingTaxOffice,
          taxNumber: input.invoice.billingTaxNumber
        };
    const order = await createWebsiteOrder({ ...input, billingAddress, invoice: input.invoice });
    createdOrderId = order.id;
    const paymentRequest: PaymentRequest = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: Number(order.total),
      currency: "TRY",
      customer: input.customer,
      userIp: ip,
      billingAddress: {
        line1: input.address.line1,
        district: input.address.district,
        city: input.address.city,
        country: "TR"
      },
      items: order.items.map((item) => ({
        title: item.title,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice)
      })),
      installment: input.installment ?? 1,
      successUrl: `${process.env.APP_URL ?? "http://localhost:3000"}/order-success`,
      failUrl: `${process.env.APP_URL ?? "http://localhost:3000"}/payment/failed`
    };
    const payment = await createPaymentSessionWithFallback({
      requestedProvider: providerName,
      request: paymentRequest,
      onAttemptFailure: async (failure) => {
        await prisma.paymentLog.create({
          data: {
            orderId: order.id,
            provider: failure.provider as PrismaPaymentProvider,
            eventType: "checkout_provider_failed",
            status: "failed",
            merchantOid: order.id,
            amount: Number(order.total),
            installment: input.installment ?? 1,
            ipAddress: ip,
            userAgent: request.headers.get("user-agent") ?? undefined,
            errorMessage: failure.reason
          }
        });
      }
    });
    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: payment.provider as PrismaPaymentProvider,
        providerRef: payment.reference,
        sessionId: payment.sessionId,
        status: payment.status === "paid" ? "paid" : "pending",
        amount: Number(order.total),
        currency: "TRY",
        checkoutUrl: payment.iframeUrl ?? payment.redirectUrl,
        installment: input.installment ?? 1,
        gatewayStatus: payment.status,
        rawPayload: payment as object,
        paidAt: payment.status === "paid" ? new Date() : undefined,
        expiresAt: payment.expiresAt ? new Date(payment.expiresAt) : undefined
      }
    });
    await prisma.paymentLog.create({
      data: {
        orderId: order.id,
        provider: payment.provider as PrismaPaymentProvider,
        eventType: "checkout_session_created",
        status: "pending",
        providerRef: payment.reference,
        merchantOid: order.id,
        amount: Number(order.total),
        installment: input.installment ?? 1,
        fraudScore: payment.fraudSignals?.requiresReview ? 75 : 10,
        riskLevel: payment.fraudSignals?.requiresReview ? "review" : "low",
        ipAddress: ip,
        userAgent: request.headers.get("user-agent") ?? undefined,
        rawPayload: payment as object
      }
    });
    return NextResponse.json({ order, payment });
  } catch (error) {
    if (createdOrderId) {
      await releaseFailedCheckout(createdOrderId).catch(() => null);
    }
    const message = error instanceof Error ? error.message : "Checkout başlatılamadı.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

async function releaseFailedCheckout(orderId: string) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { reservations: true }
    });
    if (!order) return;

    const activeReservations = order.reservations.filter((reservation) => reservation.status === "active");
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

    await tx.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "failed",
        orderStatus: "cancelled"
      }
    });
  });
}
