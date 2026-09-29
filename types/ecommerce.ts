export type SalesChannel = "website" | "trendyol" | "hepsiburada" | "amazon" | "n11";

export type OrderWorkflowStatus = "created" | "paid" | "processing" | "preparing" | "shipped" | "delivered" | "cancelled" | "returned";

export type ShipmentWorkflowStatus = "not_ready" | "label_created" | "in_transit" | "delivered" | "exception" | "returned";

export type CarrierCode = "manual" | "yurtici";

export type ShippingServiceLevel = "standard" | "oversized" | "freight";

export type Money = {
  amount: number;
  currency: "TRY";
};

export type CheckoutLineInput = {
  productId: string;
  variantId?: string;
  sku: string;
  barcode?: string;
  quantity: number;
  unitPrice: number;
  title: string;
  color?: string;
  size?: string;
};

export type CustomerInput = {
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
};

export type AddressInput = {
  fullName: string;
  phone?: string;
  line1: string;
  line2?: string;
  district: string;
  city: string;
  postalCode?: string;
  invoiceType?: "individual" | "corporate";
  taxOffice?: string;
  taxNumber?: string;
};

export type InvoiceType = "individual" | "corporate";

export type InvoiceStatus = "not_issued" | "issued" | "cancelled";

export type InvoiceInput = {
  type: InvoiceType;
  billingSameAsShipping: boolean;
  billingName?: string;
  billingCompany?: string;
  billingTaxNumber?: string;
  billingTaxOffice?: string;
  billingAddress: string;
};

export type PaymentProviderName = "mock" | "paytr" | "iyzico" | "stripe" | "marketplace";

export type CheckoutPaymentMethod = "paytr";

export type InstallmentOption = {
  count: number;
  label: string;
  totalAmount: number;
  monthlyAmount: number;
};

export type ShippingQuoteLine = {
  productId: string;
  title: string;
  quantity: number;
  size?: string;
  unitPrice: number;
};

export type ShippingQuote = {
  carrier: CarrierCode;
  serviceLevel: ShippingServiceLevel;
  price: number;
  currency: "TRY";
  freeShippingApplied: boolean;
  threshold: number;
  requiresManualReview: boolean;
  reason?: string;
};

export type MarketplaceChannel = Exclude<SalesChannel, "website">;

export type MarketplaceStockUpdate = {
  channel: MarketplaceChannel;
  sku: string;
  barcode?: string;
  quantity: number;
};
