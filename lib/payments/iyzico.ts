import crypto from "crypto";
import { PaymentProvider } from "@/lib/payments/types";

export const iyzicoPaymentProvider: PaymentProvider = {
  name: "iyzico",
  capabilities: {
    installments: true,
    guestCheckout: true,
    threeDSecure: true,
    savedCards: true
  },
  async createPayment(request) {
    const apiKey = process.env.IYZICO_API_KEY || "sandbox-api-key-pending";
    const secretKey = process.env.IYZICO_SECRET_KEY || "sandbox-secret-key-pending";
    const baseUrl = process.env.IYZICO_BASE_URL ?? "https://sandbox-api.iyzipay.com";
    const payload = createCheckoutPayload(request);
    const authorization = createIyzicoAuthorization(apiKey, secretKey, payload);
    void authorization;

    return {
      provider: "iyzico",
      reference: request.orderId,
      sessionId: `iyzico-${request.orderId}`,
      redirectUrl: `${baseUrl}/payment/iyzipos/checkoutform/auth/ecom?conversationId=${request.orderId}`,
      status: "created",
      checkoutMode: "redirect",
      expiresAt: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
      fraudSignals: {
        requiresReview: request.amount >= 50000,
        reason: request.amount >= 50000 ? "High value order" : undefined
      }
    };
  },
  async verifyWebhook(payload, headers) {
    const data = payload as { conversationId?: string; paymentStatus?: string; token?: string };
    const secret = required("IYZICO_SECRET_KEY");
    const signature = headers.get("x-iyzi-signature");
    if (signature) {
      const expected = crypto.createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");
      if (expected !== signature) throw new Error("iyzico signature verification failed");
    }
    if (!data.conversationId) throw new Error("conversationId missing");
    return {
      orderId: data.conversationId,
      providerRef: data.token,
      sessionId: data.token,
      status: data.paymentStatus === "SUCCESS" ? "paid" : "failed",
      gatewayStatus: data.paymentStatus,
      paidAt: data.paymentStatus === "SUCCESS" ? new Date() : undefined,
      failureReason: data.paymentStatus === "SUCCESS" ? undefined : "iyzico payment failed",
      raw: payload
    };
  },
  async getInstallments(amount) {
    return [1, 2, 3, 6, 9].map((count) => ({
      count,
      label: count === 1 ? "Tek çekim" : `${count} taksit`,
      totalAmount: amount,
      monthlyAmount: Math.round((amount / count) * 100) / 100
    }));
  }
};

function createCheckoutPayload(request: Parameters<PaymentProvider["createPayment"]>[0]) {
  return {
    locale: "tr",
    conversationId: request.orderId,
    price: request.amount.toFixed(2),
    paidPrice: request.amount.toFixed(2),
    currency: request.currency ?? "TRY",
    installment: request.installment ?? 1,
    callbackUrl: `${process.env.APP_URL ?? "http://localhost:3000"}/api/payment/callback/iyzico`,
    buyer: {
      id: request.orderId,
      name: request.customer.name,
      surname: "-",
      email: request.customer.email,
      gsmNumber: request.customer.phone
    },
    shippingAddress: request.billingAddress,
    billingAddress: request.billingAddress,
    basketItems: request.items?.map((item) => ({
      id: item.sku,
      name: item.title,
      category1: "Home Textile",
      itemType: "PHYSICAL",
      price: (item.unitPrice * item.quantity).toFixed(2)
    }))
  };
}

function createIyzicoAuthorization(apiKey: string, secretKey: string, payload: unknown) {
  const randomString = crypto.randomBytes(16).toString("hex");
  const payloadText = JSON.stringify(payload);
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(`${randomString}${payloadText}`)
    .digest("hex");
  return `IYZWSv2 ${apiKey}:${signature}`;
}

function required(key: string) {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is required`);
  return value;
}
