import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const logs = await prisma.paymentLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100
    });
    const orderIds = logs.map((log) => log.orderId).filter((orderId): orderId is string => Boolean(orderId));
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      select: { id: true, orderNumber: true }
    });
    const orderNumbers = new Map(orders.map((order) => [order.id, order.orderNumber]));
    return NextResponse.json({
      logs: logs.map((log) => ({
        id: log.id,
        orderId: log.orderId,
        orderNumber: log.orderId ? orderNumbers.get(log.orderId) ?? null : null,
        paymentId: log.paymentId,
        provider: log.provider,
        eventType: log.eventType,
        callbackStatus: callbackStatus(log.eventType),
        resultLabel: resultLabel(log.status, log.errorMessage),
        status: log.status,
        providerRef: log.providerRef,
        merchantOid: log.merchantOid,
        amount: log.amount ? Number(log.amount) : null,
        installment: log.installment,
        fraudScore: log.fraudScore ? Number(log.fraudScore) : null,
        riskLevel: log.riskLevel,
        duplicate: log.duplicate,
        hashVerified: log.hashVerified,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        errorMessage: log.errorMessage,
        createdAt: log.createdAt.toISOString()
      }))
    });
  } catch {
    return NextResponse.json({ logs: [] });
  }
}

function callbackStatus(eventType: string) {
  if (eventType === "checkout_session_created") return "Ödeme denemesi";
  if (eventType === "webhook_received") return "Callback alındı";
  if (eventType === "webhook_verification_failed") return "Hash doğrulama hatası";
  if (eventType === "webhook_processing_failed") return "Callback işleme hatası";
  if (eventType === "checkout_provider_failed") return "Sağlayıcı hatası";
  if (eventType === "order_received_email_sent") return "Sipariş maili gönderildi";
  if (eventType === "order_received_email_failed") return "Sipariş maili hatası";
  return eventType;
}

function resultLabel(status: string | null, errorMessage: string | null) {
  if (errorMessage) return "Başarısız";
  if (status === "paid") return "Başarılı";
  if (status === "failed" || status === "cancelled") return "Başarısız";
  if (status === "pending") return "Bekliyor";
  return "Kayıt";
}
