import { NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments";

async function handleCallback(request: Request, providerName: string) {
  const provider = getPaymentProvider(providerName);
  const contentType = request.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await request.json()
    : Object.fromEntries((await request.formData()).entries());

  try {
    const result = await provider.verifyWebhook(payload, request.headers);
    const search = new URLSearchParams({
      orderId: result.orderId,
      provider: provider.name
    });
    if (result.status === "paid") {
      return NextResponse.redirect(`${process.env.APP_URL ?? "http://localhost:3000"}/order-success?${search.toString()}`);
    }
    search.set("reason", result.failureReason ?? "payment_failed");
    return NextResponse.redirect(`${process.env.APP_URL ?? "http://localhost:3000"}/payment/failed?${search.toString()}`);
  } catch (error) {
    const search = new URLSearchParams({ reason: String(error), provider: provider.name });
    return NextResponse.redirect(`${process.env.APP_URL ?? "http://localhost:3000"}/payment/failed?${search.toString()}`);
  }
}

export async function POST(request: Request, { params }: { params: { provider: string } }) {
  return handleCallback(request, params.provider);
}

export async function GET(request: Request, { params }: { params: { provider: string } }) {
  const url = new URL(request.url);
  return handleCallback(
    new Request(request.url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(url.searchParams.entries()))
    }),
    params.provider
  );
}
