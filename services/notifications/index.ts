export type ShipmentNotificationInput = {
  orderNumber: string;
  customer: {
    name: string;
    email?: string;
    phone?: string;
  };
  carrier?: string;
  trackingCode?: string;
  trackingUrl?: string;
};

export type InvoiceNotificationInput = {
  orderNumber: string;
  customer: {
    name: string;
    email?: string;
  };
  invoiceNumber: string;
  invoiceUrl: string;
};

export type OrderReceivedNotificationInput = {
  orderNumber: string;
  customer: {
    name: string;
    email?: string;
  };
  total: number;
  currency?: string;
};

export class NotificationService {
  async sendOrderReceived(input: OrderReceivedNotificationInput) {
    const subject = `Siparişiniz alındı: ${input.orderNumber}`;
    const text = `${input.orderNumber} numaralı siparişiniz başarıyla alındı. Toplam: ${input.total.toLocaleString("tr-TR")} ${input.currency ?? "TL"}.`;

    if (input.customer.email && process.env.RESEND_API_KEY && process.env.ORDER_EMAIL_FROM) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: process.env.ORDER_EMAIL_FROM,
          to: input.customer.email,
          subject,
          text
        })
      });

      if (!response.ok) {
        const error = await response.text().catch(() => "");
        throw new Error(error || "Sipariş alındı maili gönderilemedi.");
      }

      return {
        ok: true,
        channel: "resend",
        emailReady: true,
        message: text
      };
    }

    return {
      ok: true,
      channel: "mock",
      emailReady: Boolean(input.customer.email),
      message: text
    };
  }

  async sendShipmentCreated(input: ShipmentNotificationInput) {
    return {
      ok: true,
      channel: "mock",
      smsReady: Boolean(input.customer.phone),
      emailReady: Boolean(input.customer.email),
      message: `${input.orderNumber} siparişiniz ${input.carrier ?? "kargo"} ile hazırlanıyor.`
    };
  }

  async sendShipmentStatusChanged(input: ShipmentNotificationInput & { status: string }) {
    return {
      ok: true,
      channel: "mock",
      smsReady: Boolean(input.customer.phone),
      emailReady: Boolean(input.customer.email),
      message: `${input.orderNumber} kargo durumu: ${input.status}`
    };
  }

  async sendInvoiceUploaded(input: InvoiceNotificationInput) {
    return {
      ok: true,
      channel: "mock",
      emailReady: Boolean(input.customer.email),
      message: `${input.orderNumber} siparişinize ait ${input.invoiceNumber} numaralı fatura hazır.`
    };
  }
}

export const notificationService = new NotificationService();
