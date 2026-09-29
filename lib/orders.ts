import { prisma } from "@/lib/prisma";
import { calculateWebPrice, toNumber } from "@/lib/pricing";
import { orderService } from "@/services/orders";

type CheckoutLine = {
  productId: string;
  quantity: number;
  color?: string;
  size?: string;
};

type Customer = {
  name: string;
  email: string;
  phone?: string;
};

type Address = {
  line1: string;
  district: string;
  city: string;
  postalCode?: string;
  billingType?: "individual" | "corporate";
  taxOffice?: string;
  taxNumber?: string;
};

type Invoice = {
  type: "individual" | "corporate";
  billingSameAsShipping: boolean;
  billingName?: string;
  billingCompany?: string;
  billingTaxNumber?: string;
  billingTaxOffice?: string;
  billingAddress: string;
};

export async function createWebsiteOrder(input: {
  customer: Customer;
  address: Address;
  billingAddress?: Address;
  invoice?: Invoice;
  items: CheckoutLine[];
}) {
  const campaigns = await prisma.pricingCampaign.findMany({ where: { active: true }, orderBy: [{ priority: "asc" }, { createdAt: "desc" }] });
  const items = await Promise.all(
    input.items.map(async (line) => {
      const product = await prisma.product.findUnique({
        where: { id: line.productId },
        include: { variants: true }
      });
      if (!product) throw new Error("Product not found");
      const variant =
        product.variants.find((item) => item.size === line.size && item.color === line.color) ??
        product.variants[0];
      const pricing = calculateWebPrice(
        {
          productId: product.id,
          variantId: variant?.id,
          category: product.category,
          collection: product.collection,
          marketplacePrice: toNumber(variant?.marketplacePrice ?? product.marketplacePrice),
          basePrice: toNumber(variant?.basePrice ?? product.basePrice),
          webPrice: toNumber(variant?.webPrice ?? product.webPrice),
          salePrice: toNumber(variant?.salePrice ?? product.salePrice),
          compareAtPrice: toNumber(variant?.compareAtPrice ?? variant?.comparePrice ?? product.compareAtPrice),
          finalPrice: toNumber(variant?.finalPrice ?? product.finalPrice),
          legacyPrice: toNumber(variant?.price ?? product.price),
          legacyComparePrice: toNumber(variant?.comparePrice),
          manualPriceOverride: variant?.manualPriceOverride ?? product.manualPriceOverride
        },
        campaigns
      );
      const unitPrice = pricing.finalPrice;
      return {
        productId: product.id,
        variantId: variant?.id,
        sku: variant?.sku ?? product.sku,
        barcode: variant?.barcode ?? product.barcode ?? undefined,
        title: product.title,
        quantity: line.quantity,
        unitPrice,
        color: line.color ?? variant?.color,
        size: line.size ?? variant?.size
      };
    })
  );

  return orderService.createOrder({
    source: "website",
    customer: normalizeCustomer(input.customer),
    shippingAddress: normalizeAddress(input.customer, input.address),
    billingAddress: input.billingAddress ? normalizeAddress(input.customer, input.billingAddress) : undefined,
    invoice: input.invoice,
    items
  });
}

export async function importTrendyolOrder(input: {
  externalOrderId: string;
  customer: Customer;
  address: Address;
  items: Array<{ barcode: string; quantity: number; unitPrice: number; title: string }>;
}) {
  const items = await Promise.all(
    input.items.map(async (line) => {
      const variant = await prisma.productVariant.findFirst({
        where: { OR: [{ barcode: line.barcode }, { product: { trendyolBarcode: line.barcode } }] },
        include: { product: true }
      });
      const product = variant?.product ?? (await prisma.product.findFirst({ where: { barcode: line.barcode } }));
      if (!product) throw new Error(`Product not found for barcode ${line.barcode}`);
      return {
        productId: product.id,
        variantId: variant?.id,
        sku: variant?.sku ?? product.sku,
        barcode: line.barcode,
        title: line.title || product.title,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        color: variant?.color,
        size: variant?.size
      };
    })
  );

  return orderService.createOrder({
    source: "trendyol",
    externalOrderId: input.externalOrderId,
    customer: normalizeCustomer(input.customer),
    shippingAddress: normalizeAddress(input.customer, input.address),
    items
  });
}

function normalizeCustomer(customer: Customer) {
  const [firstName, ...rest] = customer.name.trim().split(/\s+/);
  return {
    email: customer.email,
    phone: customer.phone,
    firstName: firstName || customer.name,
    lastName: rest.join(" ") || "-"
  };
}

function normalizeAddress(customer: Customer, address: Address) {
  return {
    fullName: customer.name,
    phone: customer.phone,
    line1: address.line1,
    district: address.district,
    city: address.city,
    postalCode: address.postalCode,
    invoiceType: address.billingType,
    taxOffice: address.taxOffice,
    taxNumber: address.taxNumber
  };
}
