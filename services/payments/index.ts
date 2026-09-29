import { PaymentProviderName } from "@/types/ecommerce";

export type CreatePaymentInput = {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency?: "TRY";
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  successUrl: string;
  failUrl: string;
};

export type PaymentSession = {
  provider: PaymentProviderName;
  reference: string;
  redirectUrl?: string;
  htmlForm?: string;
  status: "created" | "paid" | "failed";
};

export type PaymentWebhookResult = {
  orderId: string;
  providerRef?: string;
  status: "paid" | "failed" | "cancelled" | "refunded";
  raw: unknown;
};

export interface PaymentAdapter {
  name: PaymentProviderName;
  createPayment(input: CreatePaymentInput): Promise<PaymentSession>;
  verifyWebhook(payload: unknown, headers: Headers): Promise<PaymentWebhookResult>;
}

export class MockPaymentAdapter implements PaymentAdapter {
  name: PaymentProviderName = "mock";

  async createPayment(input: CreatePaymentInput): Promise<PaymentSession> {
    return {
      provider: "mock",
      reference: `mock-${input.orderNumber}`,
      redirectUrl: `${input.successUrl}?orderId=${input.orderId}&orderNumber=${input.orderNumber}&mockPaid=true`,
      status: "created"
    };
  }

  async verifyWebhook(payload: unknown): Promise<PaymentWebhookResult> {
    const data = payload as { orderId?: string; status?: string; reference?: string };
    if (!data.orderId) throw new Error("orderId missing");
    return {
      orderId: data.orderId,
      providerRef: data.reference,
      status: data.status === "paid" ? "paid" : "failed",
      raw: payload
    };
  }
}

export class PaytrPaymentAdapter extends MockPaymentAdapter {
  name: PaymentProviderName = "paytr";
}

export class IyzicoPaymentAdapter extends MockPaymentAdapter {
  name: PaymentProviderName = "iyzico";
}

export class StripePaymentAdapter extends MockPaymentAdapter {
  name: PaymentProviderName = "stripe";
}

export function getPaymentAdapter(name: PaymentProviderName = "mock"): PaymentAdapter {
  if (name === "paytr") return new PaytrPaymentAdapter();
  if (name === "iyzico") return new IyzicoPaymentAdapter();
  if (name === "stripe") return new StripePaymentAdapter();
  return new MockPaymentAdapter();
}
