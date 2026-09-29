import { PaymentProvider } from "@/lib/payments/types";

export const mockPaymentProvider: PaymentProvider = {
  name: "mock",
  capabilities: {
    installments: true,
    guestCheckout: true,
    threeDSecure: false,
    savedCards: false
  },
  async createPayment(request) {
    return {
      provider: "mock",
      reference: `mock-${request.orderNumber}`,
      redirectUrl: `${request.successUrl}?orderId=${request.orderId}&orderNumber=${request.orderNumber}&value=${request.amount}&mockPaid=true`,
      status: "created",
      checkoutMode: "redirect"
    };
  },
  async verifyWebhook(payload) {
    const data = payload as { orderId?: string; status?: string; reference?: string };
    if (!data.orderId) throw new Error("orderId missing");
    return {
      orderId: data.orderId,
      providerRef: data.reference,
      status: data.status === "paid" ? "paid" : "failed",
      raw: payload
    };
  },
  async getInstallments(amount) {
    return [1, 2, 3, 6].map((count) => ({
      count,
      label: count === 1 ? "Tek çekim" : `${count} taksit`,
      totalAmount: amount,
      monthlyAmount: Math.round((amount / count) * 100) / 100
    }));
  }
};
