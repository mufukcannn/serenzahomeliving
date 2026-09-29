type ProductExport = {
  barcode: string;
  title: string;
  description: string;
  quantity: number;
  salePrice: number;
  listPrice: number;
  images: string[];
  categoryName: string;
};

type StockUpdate = {
  barcode: string;
  quantity: number;
};

type PriceUpdate = {
  barcode: string;
  salePrice: number;
  listPrice: number;
};

type OrderStatusUpdate = {
  packageId: string;
  status: "Picking" | "Invoiced" | "Shipped" | "Cancelled" | "Delivered";
};

class TrendyolService {
  async exportProducts(products: ProductExport[]) {
    return this.request("/integration/product/sellers/{supplierId}/products", {
      method: "POST",
      body: { items: products }
    });
  }

  async updateStock(stockItems: StockUpdate | StockUpdate[]) {
    const items = Array.isArray(stockItems) ? stockItems : [stockItems];
    return this.request("/integration/inventory/sellers/{supplierId}/products/price-and-inventory", {
      method: "POST",
      body: { items: items.map((item) => ({ barcode: item.barcode, quantity: item.quantity })) }
    });
  }

  async updatePrice(priceItems: PriceUpdate | PriceUpdate[]) {
    const items = Array.isArray(priceItems) ? priceItems : [priceItems];
    return this.request("/integration/inventory/sellers/{supplierId}/products/price-and-inventory", {
      method: "POST",
      body: { items: items.map((item) => ({ barcode: item.barcode, salePrice: item.salePrice, listPrice: item.listPrice })) }
    });
  }

  async fetchOrders(params: { startDate?: number; endDate?: number; status?: string; page?: number; size?: number } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.set(key, String(value));
    });
    return this.request(`/integration/order/sellers/{supplierId}/orders?${searchParams.toString()}`, {
      method: "GET"
    });
  }

  async updateOrderStatus(update: OrderStatusUpdate) {
    return this.request(`/integration/order/sellers/{supplierId}/shipment-packages/${update.packageId}`, {
      method: "PUT",
      body: { status: update.status }
    });
  }

  async sendTrackingNumber(input: { packageId: string; trackingNumber: string; cargoProviderName: string }) {
    return this.request(`/integration/order/sellers/{supplierId}/shipment-packages/${input.packageId}/cargo-tracking-number`, {
      method: "PUT",
      body: {
        trackingNumber: input.trackingNumber,
        cargoProviderName: input.cargoProviderName
      }
    });
  }

  async fetchCustomerQuestions() {
    return this.request("/integration/qna/sellers/{supplierId}/questions/filter", {
      method: "GET"
    });
  }

  private async request(path: string, options: { method: string; body?: unknown }) {
    const integration = await resolveIntegrationConfig("marketplace", "trendyol");
    const config = integration.config as Record<string, unknown>;
    const secrets = integration.secrets as Record<string, unknown>;
    const supplierId = String(config.supplierId || process.env.TRENDYOL_SUPPLIER_ID || "");
    const apiKey = String(secrets.apiKey || process.env.TRENDYOL_API_KEY || "");
    const apiSecret = String(secrets.apiSecret || process.env.TRENDYOL_API_SECRET || "");
    if (!supplierId || !apiKey || !apiSecret) {
      return { skipped: true, reason: "TRENDYOL credentials missing", path, body: options.body };
    }

    const baseUrl = process.env.TRENDYOL_BASE_URL ?? "https://apigw.trendyol.com";
    const url = `${baseUrl}${path.replace("{supplierId}", supplierId)}`;
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
    const response = await fetch(url, {
      method: options.method,
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        "User-Agent": process.env.TRENDYOL_USER_AGENT ?? "RugsTR/1.0"
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    await writeIntegrationLog({
      settingId: integration.settingId,
      category: "marketplace",
      provider: "trendyol",
      operation: options.method,
      success: response.ok,
      statusCode: response.status,
      error: response.ok ? null : text
    });
    if (!response.ok) throw new Error(`Trendyol API error ${response.status}: ${text}`);
    return data;
  }
}

export const trendyolService = new TrendyolService();
import { resolveIntegrationConfig, writeIntegrationLog } from "@/lib/integrations/settings";
