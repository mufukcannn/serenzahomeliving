import { prisma } from "@/lib/prisma";
import { notificationService } from "@/services/notifications";

export type InvoiceProviderName = "manual" | "parasut" | "logo" | "mikro" | "uyumsoft";

export type UpdateManualInvoiceInput = {
  orderId: string;
  invoiceNumber: string;
  invoiceUrl: string;
};

export interface InvoiceProvider {
  name: InvoiceProviderName;
  createInvoice?(orderId: string): Promise<{ invoiceNumber: string; invoiceUrl?: string; raw?: unknown }>;
}

const manualInvoiceProvider: InvoiceProvider = {
  name: "manual"
};

const invoiceProviders: Record<InvoiceProviderName, InvoiceProvider> = {
  manual: manualInvoiceProvider,
  parasut: { name: "parasut" },
  logo: { name: "logo" },
  mikro: { name: "mikro" },
  uyumsoft: { name: "uyumsoft" }
};

export class InvoiceService {
  getProvider(name: InvoiceProviderName = "manual") {
    return invoiceProviders[name] ?? manualInvoiceProvider;
  }

  async updateManualInvoice(input: UpdateManualInvoiceInput) {
    const order = await prisma.order.update({
      where: { id: input.orderId },
      data: {
        invoiceStatus: "issued",
        invoiceNumber: input.invoiceNumber,
        invoiceUrl: input.invoiceUrl
      }
    });

    const customer = order.customerSnapshot as { firstName?: string; lastName?: string; email?: string } | null;
    await notificationService.sendInvoiceUploaded({
      orderNumber: order.orderNumber,
      customer: {
        name: [customer?.firstName, customer?.lastName].filter(Boolean).join(" ") || order.billingName || order.billingCompany || "Müşteri",
        email: customer?.email
      },
      invoiceNumber: input.invoiceNumber,
      invoiceUrl: input.invoiceUrl
    });

    return order;
  }
}

export const invoiceService = new InvoiceService();
