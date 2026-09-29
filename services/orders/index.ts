import { prisma } from "@/lib/prisma";
import { inventoryService } from "@/services/inventory";
import { calculateShippingQuote } from "@/services/logistics";
import { AddressInput, CheckoutLineInput, CustomerInput, InvoiceInput, SalesChannel } from "@/types/ecommerce";

export type CreateOrderInput = {
  source: SalesChannel;
  customer: CustomerInput;
  shippingAddress: AddressInput;
  billingAddress?: AddressInput;
  invoice?: InvoiceInput;
  items: CheckoutLineInput[];
  externalOrderId?: string;
  notes?: unknown;
};

export class OrderService {
  async createOrder(input: CreateOrderInput) {
    return prisma.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: { email: input.customer.email },
        update: {
          phone: input.customer.phone,
          firstName: input.customer.firstName,
          lastName: input.customer.lastName
        },
        create: input.customer
      });

      const shippingAddress = await tx.address.create({
        data: { ...input.shippingAddress, customerId: customer.id }
      });
      const billingAddress = input.billingAddress
        ? await tx.address.create({ data: { ...input.billingAddress, customerId: customer.id } })
        : shippingAddress;

      const subtotal = input.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      const shippingQuote = calculateShippingQuote(
        input.items.map((item) => ({
          productId: item.productId,
          title: item.title,
          quantity: item.quantity,
          size: item.size,
          unitPrice: item.unitPrice
        })),
        "yurtici"
      );
      const shippingTotal = input.source === "website" ? shippingQuote.price : 0;
      const total = subtotal + shippingTotal;

      const order = await tx.order.create({
        data: {
          orderNumber: makeOrderNumber(input.source === "website" ? "WEB" : input.source.toUpperCase()),
          customerId: customer.id,
          shippingAddressId: shippingAddress.id,
          billingAddressId: billingAddress.id,
          customerSnapshot: input.customer,
          addressSnapshot: input.shippingAddress,
          source: input.source,
          externalOrderId: input.externalOrderId,
          subtotal,
          shippingTotal,
          total,
          shippingServiceLevel: shippingQuote.serviceLevel,
          shippingRequiresReview: shippingQuote.requiresManualReview,
          invoiceType: input.invoice?.type ?? input.billingAddress?.invoiceType ?? input.shippingAddress.invoiceType ?? "individual",
          invoiceStatus: "not_issued",
          billingName: input.invoice?.billingName ?? input.billingAddress?.fullName ?? input.shippingAddress.fullName,
          billingCompany: input.invoice?.billingCompany,
          billingTaxNumber: input.invoice?.billingTaxNumber ?? input.billingAddress?.taxNumber,
          billingTaxOffice: input.invoice?.billingTaxOffice ?? input.billingAddress?.taxOffice,
          billingAddressText: input.invoice?.billingAddress ?? formatAddress(billingAddress),
          notes: input.notes as object | undefined,
          items: {
            create: input.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              title: item.title,
              sku: item.sku,
              barcode: item.barcode,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.unitPrice * item.quantity,
              color: item.color,
              size: item.size
            }))
          },
          shipment: {
            create: {
              provider: shippingQuote.carrier,
              carrier: shippingQuote.carrier === "yurtici" ? "Yurtiçi Kargo" : "Manuel Kargo",
              shippingCost: shippingTotal,
              shipmentStatus: shippingQuote.requiresManualReview ? "not_ready" : "label_created",
              statusHistory: [
                {
                  status: shippingQuote.requiresManualReview ? "not_ready" : "label_created",
                  timestamp: new Date().toISOString(),
                  note: shippingQuote.reason ?? "Shipment prepared from order service"
                }
              ]
            }
          }
        },
        include: { items: true, shipment: true }
      });

      for (const item of input.items) {
        const reservation = await inventoryService.reserveWithTransaction(tx, {
          productId: item.productId,
          variantId: item.variantId,
          sku: item.sku,
          quantity: item.quantity,
          channel: input.source,
          orderId: order.id,
          externalOrderId: input.externalOrderId,
          expiresAt: input.source === "website" ? new Date(Date.now() + 1000 * 60 * 30) : undefined
        });
        if (input.source !== "website") {
          await tx.inventoryReservation.update({
            where: { id: reservation.id },
            data: { status: "committed", committedAt: new Date() }
          });
          await tx.inventory.update({
            where: { id: reservation.inventoryId },
            data: {
              onHand: { decrement: reservation.quantity },
              reserved: { decrement: reservation.quantity }
            }
          });
        }
      }

      return order;
    });
  }
}

export const orderService = new OrderService();

function makeOrderNumber(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function formatAddress(address: {
  line1: string;
  line2?: string | null;
  district: string;
  city: string;
  postalCode?: string | null;
}) {
  return [address.line1, address.line2, address.district, address.city, address.postalCode].filter(Boolean).join(" / ");
}
