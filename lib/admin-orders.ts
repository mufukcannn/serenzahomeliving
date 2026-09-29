import { PaymentProvider, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AdminOrder } from "@/lib/admin-data";

type OrderWithAdminRelations = Prisma.OrderGetPayload<{
  include: {
    items: {
      include: {
        product: {
          include: {
            productImages: {
              orderBy: { sortOrder: "asc" };
              take: 1;
            };
          };
        };
      };
    };
    payments: {
      orderBy: { createdAt: "desc" };
      take: 1;
    };
    shipment: true;
    marketplaceOrder: true;
  };
}>;

export async function getAdminOrdersFromDatabase(limit = 50): Promise<AdminOrder[]> {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      items: {
        include: {
          product: {
            include: {
              productImages: {
                orderBy: { sortOrder: "asc" },
                take: 1
              }
            }
          }
        }
      },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1
      },
      shipment: true,
      marketplaceOrder: true
    }
  });

  return orders.map(mapOrderToAdminOrder);
}

export async function getAdminOrderFromDatabase(orderId: string): Promise<AdminOrder | undefined> {
  const order = await prisma.order.findFirst({
    where: {
      OR: [{ id: orderId }, { orderNumber: orderId }]
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              productImages: {
                orderBy: { sortOrder: "asc" },
                take: 1
              }
            }
          }
        }
      },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1
      },
      shipment: true,
      marketplaceOrder: true
    }
  });

  return order ? mapOrderToAdminOrder(order) : undefined;
}

function mapOrderToAdminOrder(order: OrderWithAdminRelations): AdminOrder {
  const customer = order.customerSnapshot as Partial<{ name: string; firstName: string; lastName: string; email: string; phone: string }> | null;
  const address = order.addressSnapshot as Partial<{ city: string; district: string; line1: string; invoiceType: "individual" | "corporate" }> | null;
  const payment = order.payments[0];
  const invoiceStatus = normalizeInvoiceStatus(order.invoiceStatus);
  const paymentStatus = normalizePaymentStatus(order.paymentStatus);
  const orderStatus = normalizeOrderStatus(order.orderStatus);
  const shipmentStatus = normalizeShipmentStatus(order.shipment?.shipmentStatus);
  const customerName = customer?.name ?? ([customer?.firstName, customer?.lastName].filter(Boolean).join(" ") || "Müşteri");

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customer: {
      name: customerName,
      email: customer?.email ?? "-",
      phone: customer?.phone ?? "-"
    },
    address: {
      city: address?.city ?? "-",
      district: address?.district ?? "-",
      line1: address?.line1 ?? "-",
      invoiceType: address?.invoiceType ?? normalizeInvoiceType(order.invoiceType)
    },
    source: normalizeSource(order.source),
    externalOrderId: order.externalOrderId ?? undefined,
    trendyolOrderNumber: order.source === "trendyol" ? order.externalOrderId ?? order.marketplaceOrder?.externalOrderId : undefined,
    marketplaceOrderNumber: order.marketplaceOrder?.externalPackageId ?? order.marketplaceOrder?.externalOrderId ?? order.externalOrderId ?? undefined,
    total: Number(order.total),
    paymentStatus,
    orderStatus,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      title: item.title,
      image: item.product.productImages[0]?.url ?? item.product.images[0] ?? "/brand-images/hali-kategori.jpg",
      sku: item.sku,
      barcode: item.barcode ?? undefined,
      size: item.size ?? "-",
      color: item.color ?? "-",
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      total: Number(item.total)
    })),
    payment: {
      provider: normalizePaymentProvider(payment?.provider),
      reference: payment?.providerRef ?? order.id,
      sessionId: payment?.sessionId ?? undefined,
      installment: payment?.installment,
      gatewayStatus: payment?.gatewayStatus ?? paymentStatus,
      failureReason: payment?.failureReason ?? undefined,
      paidAt: payment?.paidAt ? formatDate(payment.paidAt) : undefined,
      amount: Number(payment?.amount ?? order.total)
    },
    invoice: {
      type: normalizeInvoiceType(order.invoiceType),
      status: invoiceStatus,
      number: order.invoiceNumber ?? undefined,
      url: order.invoiceUrl ?? undefined,
      billingName: order.billingName ?? undefined,
      billingCompany: order.billingCompany ?? undefined,
      billingTaxNumber: order.billingTaxNumber ?? undefined,
      billingTaxOffice: order.billingTaxOffice ?? undefined,
      billingAddress: order.billingAddressText ?? "-"
    },
    notes: Array.isArray(order.notes) ? (order.notes as AdminOrder["notes"]) : [],
    timeline: buildTimeline(orderStatus, order.createdAt, payment?.paidAt),
    carrier: order.shipment?.carrier ?? undefined,
    carrierProvider: order.shipment?.provider ?? undefined,
    trackingCode: order.shipment?.trackingCode ?? undefined,
    trackingUrl: order.shipment?.trackingUrl ?? undefined,
    shippingLabelUrl: order.shipment?.labelUrl ?? undefined,
    assignedTo: order.assignedTo ?? undefined,
    assignedUserId: order.shipment?.assignedUserId ?? undefined,
    shippedAt: order.shipment?.shippedAt ? formatDate(order.shipment.shippedAt) : undefined,
    shipmentStatus,
    shippingServiceLevel: normalizeServiceLevel(order.shippingServiceLevel),
    shippingRequiresReview: order.shippingRequiresReview,
    shippingCost: Number(order.shipment?.shippingCost ?? order.shippingTotal),
    profit: {
      commission: Number(order.commission),
      cargoCost: Number(order.cargoCost),
      marketplaceFee: Number(order.marketplaceFee),
      netProfit: Number(order.netProfit)
    },
    createdAt: formatDate(order.createdAt)
  };
}

function buildTimeline(orderStatus: AdminOrder["orderStatus"], createdAt: Date, paidAt?: Date | null): AdminOrder["timeline"] {
  const timeline: AdminOrder["timeline"] = [
    {
      status: "created",
      timestamp: formatDate(createdAt),
      note: "Checkout sonrası pending sipariş oluşturuldu."
    }
  ];
  if (paidAt || ["paid", "processing", "preparing", "shipped", "delivered"].includes(orderStatus)) {
    timeline.push({
      status: "processing",
      timestamp: formatDate(paidAt ?? createdAt),
      note: "Ödeme doğrulandı, sipariş işleme alındı."
    });
  }
  if (["shipped", "delivered"].includes(orderStatus)) {
    timeline.push({
      status: "shipped",
      timestamp: formatDate(paidAt ?? createdAt),
      note: "Sipariş kargoya verildi."
    });
  }
  return timeline;
}

function formatDate(date: Date) {
  return date.toLocaleString("tr-TR");
}

function normalizePaymentProvider(provider?: PaymentProvider): AdminOrder["payment"]["provider"] {
  if (provider === "mock" || provider === "paytr" || provider === "iyzico" || provider === "stripe" || provider === "marketplace") return provider;
  return "paytr";
}

function normalizeSource(source: string): AdminOrder["source"] {
  if (source === "website" || source === "trendyol" || source === "hepsiburada" || source === "amazon" || source === "n11") return source;
  return "website";
}

function normalizePaymentStatus(status: string): AdminOrder["paymentStatus"] {
  if (status === "paid" || status === "failed" || status === "cancelled" || status === "refunded" || status === "authorized") return status;
  return "pending";
}

function normalizeOrderStatus(status: string): AdminOrder["orderStatus"] {
  if (status === "created" || status === "paid" || status === "processing" || status === "preparing" || status === "shipped" || status === "delivered" || status === "cancelled" || status === "returned") return status;
  return "created";
}

function normalizeShipmentStatus(status?: string): AdminOrder["shipmentStatus"] {
  if (status === "not_ready" || status === "label_created" || status === "in_transit" || status === "delivered" || status === "exception" || status === "returned") return status;
  return "not_ready";
}

function normalizeInvoiceType(type?: string): AdminOrder["invoice"]["type"] {
  return type === "corporate" ? "corporate" : "individual";
}

function normalizeInvoiceStatus(status?: string): AdminOrder["invoice"]["status"] {
  if (status === "issued" || status === "cancelled") return status;
  return "not_issued";
}

function normalizeServiceLevel(level?: string | null): AdminOrder["shippingServiceLevel"] {
  if (level === "standard" || level === "oversized" || level === "freight") return level;
  return "standard";
}
