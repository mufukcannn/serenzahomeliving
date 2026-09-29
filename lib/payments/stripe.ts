import crypto from "crypto";
import { PaymentProvider } from "@/lib/payments/types";

export const stripePaymentProvider: PaymentProvider = {
  name: "stripe",
  capabilities: {
    installments: false,
    guestCheckout: true,
    threeDSecure: true,
    savedCards: true
  },
  async createPayment(request) {
    const secretKey = process.env.STRIPE_SECRET_KEY || "sk_test_pending";
    void secretKey;
    return {
      provider: "stripe",
      reference: request.orderId,
      sessionId: `cs_serenza_${request.orderId}`,
      redirectUrl: `${request.successUrl}?orderId=${request.orderId}&orderNumber=${request.orderNumber}&value=${request.amount}&stripeSession=mock`,
      status: "created",
      checkoutMode: "redirect",
      expiresAt: new Date(Date.now() + 1000 * 60 * 30).toISOString()
    };
  },
  async verifyWebhook(payload, headers) {
    const signature = headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (signature && webhookSecret) {
      const expected = crypto.createHmac("sha256", webhookSecret).update(JSON.stringify(payload)).digest("hex");
      if (!signature.includes(expected)) throw new Error("Stripe signature verification failed");
    }

    const data = payload as {
      type?: string;
      data?: { object?: { client_reference_id?: string; id?: string; payment_status?: string; amount_total?: number } };
    };
    const session = data.data?.object;
    const paid = data.type === "checkout.session.completed" || session?.payment_status === "paid";
    if (!session?.client_reference_id) throw new Error("client_reference_id missing");
    return {
      orderId: session.client_reference_id,
      providerRef: session.id,
      sessionId: session.id,
      status: paid ? "paid" : "failed",
      amount: session.amount_total ? session.amount_total / 100 : undefined,
      gatewayStatus: data.type,
      failureReason: paid ? undefined : "Stripe checkout was not completed",
      raw: payload
    };
  }
};
