import { NextResponse } from "next/server";
import { createPaytrCallbackHash } from "@/lib/payments/paytr";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId");
  if (!orderId) return new Response("orderId gerekli", { status: 400 });

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, orderNumber: true, total: true }
  });
  if (!order) return new Response("Sipariş bulunamadı", { status: 404 });

  const amount = Math.round(Number(order.total) * 100).toString();
  const wrongAmount = String(Number(amount) + 100);
  const callbackUrl = process.env.PAYTR_CALLBACK_URL || `${url.origin}/api/payment/webhook/paytr`;

  return new NextResponse(
    renderTestFrame({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount,
      wrongAmount,
      callbackUrl,
      successHash: await paytrHash(order.id, "success", amount),
      failedHash: await paytrHash(order.id, "failed", amount),
      mismatchHash: await paytrHash(order.id, "success", wrongAmount)
    }),
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store"
      }
    }
  );
}

function renderTestFrame(input: { orderId: string; orderNumber: string; amount: string; wrongAmount: string; callbackUrl: string; successHash: string; failedHash: string; mismatchHash: string }) {
  return `<!doctype html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>PayTR Test Ödeme</title>
    <style>
      body { margin: 0; font-family: Inter, Arial, sans-serif; background: #fbfaf7; color: #1c1917; }
      main { min-height: 100vh; display: grid; place-items: center; padding: 32px; }
      section { width: min(560px, 100%); border: 1px solid #ddd6ce; background: #fff; padding: 28px; box-shadow: 0 24px 70px rgba(28,25,23,.08); }
      p.label { margin: 0; font-size: 11px; letter-spacing: .22em; text-transform: uppercase; color: #9a8f84; }
      h1 { margin: 10px 0 12px; font-family: Georgia, serif; font-weight: 400; font-size: 36px; }
      .meta { margin: 0 0 22px; color: #57534e; line-height: 1.7; }
      form { margin-top: 12px; }
      button { width: 100%; border: 0; padding: 15px 18px; font-size: 11px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; cursor: pointer; }
      .success { background: #14532d; color: #f0fdf4; }
      .failed { background: #7f1d1d; color: #fef2f2; }
      .mismatch { background: #292524; color: #fafaf9; }
      small { display: block; margin-top: 18px; color: #78716c; line-height: 1.6; }
    </style>
  </head>
  <body>
    <main>
      <section>
        <p class="label">PayTR Test Mode</p>
        <h1>Test Ödeme</h1>
        <p class="meta">Sipariş: <strong>${escapeHtml(input.orderNumber)}</strong><br />Tutar: <strong>${(Number(input.amount) / 100).toLocaleString("tr-TR")} TL</strong></p>
        ${form(input.callbackUrl, input.orderId, "success", input.amount, input.successHash, "Başarılı Ödeme", "success")}
        ${form(input.callbackUrl, input.orderId, "failed", input.amount, input.failedHash, "Başarısız Ödeme", "failed", "Test ödeme reddedildi")}
        ${form(input.callbackUrl, input.orderId, "success", input.wrongAmount, input.mismatchHash, "Tutar Hatalı Callback", "mismatch")}
        <small>Bu ekran yalnızca PAYTR_TEST_MODE=1 için yerel test akışıdır. Callback hash doğrulaması, duplicate kontrolü, tutar doğrulaması ve ödeme logları gerçek webhook endpointinden geçer.</small>
      </section>
    </main>
  </body>
</html>`;
}

function form(callbackUrl: string, orderId: string, status: string, amount: string, hash: string, label: string, className: string, failedReason?: string) {
  return `<form method="post" action="${escapeHtml(callbackUrl)}">
    <input type="hidden" name="merchant_oid" value="${escapeHtml(orderId)}" />
    <input type="hidden" name="status" value="${escapeHtml(status)}" />
    <input type="hidden" name="total_amount" value="${escapeHtml(amount)}" />
    <input type="hidden" name="hash" value="${escapeHtml(hash)}" />
    ${failedReason ? `<input type="hidden" name="failed_reason_msg" value="${escapeHtml(failedReason)}" />` : ""}
    <button class="${className}" type="submit">${escapeHtml(label)}</button>
  </form>`;
}

async function paytrHash(orderId: string, status: string, amount: string) {
  return createPaytrCallbackHash(orderId, status, amount);
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
