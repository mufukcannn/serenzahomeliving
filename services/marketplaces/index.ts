import { MarketplaceChannel, MarketplaceStockUpdate } from "@/types/ecommerce";

export type MarketplaceProductPayload = {
  productId: string;
  variantId?: string;
  sku: string;
  barcode?: string;
  title: string;
  description?: string;
  price: number;
  stock: number;
  images: string[];
};

export type MarketplaceOrderPayload = {
  channel: MarketplaceChannel;
  externalOrderId: string;
  raw: unknown;
};

export interface MarketplaceAdapter {
  channel: MarketplaceChannel;
  publishProduct(product: MarketplaceProductPayload): Promise<{ externalProductId: string; raw?: unknown }>;
  updateStock(update: MarketplaceStockUpdate): Promise<{ ok: boolean; raw?: unknown }>;
  updatePrice(input: { sku: string; barcode?: string; price: number }): Promise<{ ok: boolean; raw?: unknown }>;
  fetchOrders(since?: Date): Promise<MarketplaceOrderPayload[]>;
  updateOrderStatus(input: { externalOrderId: string; status: string; trackingCode?: string; carrier?: string }): Promise<{ ok: boolean; raw?: unknown }>;
  sendTracking(input: { externalOrderId: string; trackingCode: string; carrier: string; trackingUrl?: string }): Promise<{ ok: boolean; raw?: unknown }>;
}

class MockMarketplaceAdapter implements MarketplaceAdapter {
  constructor(public channel: MarketplaceChannel) {}

  async publishProduct(product: MarketplaceProductPayload) {
    return { externalProductId: `${this.channel}-${product.sku}`, raw: product };
  }

  async updateStock(update: MarketplaceStockUpdate) {
    return { ok: true, raw: update };
  }

  async updatePrice(input: { sku: string; barcode?: string; price: number }) {
    return { ok: true, raw: input };
  }

  async fetchOrders() {
    return [];
  }

  async updateOrderStatus(input: { externalOrderId: string; status: string; trackingCode?: string; carrier?: string }) {
    return { ok: true, raw: input };
  }

  async sendTracking(input: { externalOrderId: string; trackingCode: string; carrier: string; trackingUrl?: string }) {
    return { ok: true, raw: input };
  }
}

export class TrendyolAdapter extends MockMarketplaceAdapter {
  constructor() {
    super("trendyol");
  }
}

export function getMarketplaceAdapter(channel: MarketplaceChannel): MarketplaceAdapter {
  if (channel === "trendyol") return new TrendyolAdapter();
  return new MockMarketplaceAdapter(channel);
}
