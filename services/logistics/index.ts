import { ShipmentStatus } from "@prisma/client";
import { resolveIntegrationConfig, writeIntegrationLog } from "@/lib/integrations/settings";
import { CarrierCode, ShippingQuote, ShippingQuoteLine, ShippingServiceLevel } from "@/types/ecommerce";

export type CreateShipmentInput = {
  orderId: string;
  orderNumber: string;
  carrier: CarrierCode;
  recipient: {
    fullName: string;
    phone?: string;
    city: string;
    district: string;
    address: string;
  };
  lines: ShippingQuoteLine[];
  manual?: {
    trackingCode?: string;
    trackingUrl?: string;
  };
};

export type ShipmentLabel = {
  carrier: string;
  provider: CarrierCode;
  trackingCode?: string;
  trackingUrl?: string;
  labelUrl?: string;
  shipmentStatus: ShipmentStatus;
  raw?: unknown;
};

export interface CarrierAdapter {
  code: CarrierCode;
  displayName: string;
  createShipment(input: CreateShipmentInput): Promise<ShipmentLabel>;
  getTrackingStatus(trackingCode: string): Promise<{ status: ShipmentStatus; raw?: unknown }>;
}

export const shippingRules = {
  freeShippingThreshold: 1500,
  oversizedFreeShippingThreshold: 6000,
  standardBasePrice: 149,
  oversizedBasePrice: 249,
  freightBasePrice: 499
};

export function calculateShippingQuote(lines: ShippingQuoteLine[], carrier: CarrierCode = "yurtici"): ShippingQuote {
  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const serviceLevel = getServiceLevel(lines);
  const threshold = serviceLevel === "standard" ? shippingRules.freeShippingThreshold : shippingRules.oversizedFreeShippingThreshold;
  const freeShippingApplied = subtotal >= threshold;
  const basePrice =
    serviceLevel === "freight"
      ? shippingRules.freightBasePrice
      : serviceLevel === "oversized"
        ? shippingRules.oversizedBasePrice
        : shippingRules.standardBasePrice;

  return {
    carrier,
    serviceLevel,
    price: freeShippingApplied ? 0 : basePrice,
    currency: "TRY",
    freeShippingApplied,
    threshold,
    requiresManualReview: serviceLevel === "freight",
    reason: serviceLevel === "freight" ? "Large rug requires custom cargo handling" : undefined
  };
}

export function getServiceLevel(lines: ShippingQuoteLine[]): ShippingServiceLevel {
  const largestArea = Math.max(0, ...lines.map((line) => getSizeArea(line.size)));
  if (largestArea >= 8) return "freight";
  if (largestArea >= 4) return "oversized";
  return "standard";
}

function getSizeArea(size?: string) {
  if (!size) return 0;
  const match = size.match(/(\d{2,3})\s*x\s*(\d{2,3})/i);
  if (!match) return 0;
  return (Number(match[1]) / 100) * (Number(match[2]) / 100);
}

class ManualCargoAdapter implements CarrierAdapter {
  code: CarrierCode = "manual";
  displayName = "Manuel Kargo";

  async createShipment(input: CreateShipmentInput): Promise<ShipmentLabel> {
    return {
      carrier: this.displayName,
      provider: this.code,
      trackingCode: input.manual?.trackingCode,
      trackingUrl: input.manual?.trackingUrl,
      shipmentStatus: input.manual?.trackingCode ? "label_created" : "not_ready",
      raw: { mode: "manual" }
    };
  }

  async getTrackingStatus(): Promise<{ status: ShipmentStatus; raw?: unknown }> {
    return { status: "not_ready", raw: { mode: "manual" } };
  }
}

class YurticiCargoAdapter implements CarrierAdapter {
  code: CarrierCode = "yurtici";
  displayName = "Yurtiçi Kargo";

  async createShipment(input: CreateShipmentInput): Promise<ShipmentLabel> {
    const integration = await resolveIntegrationConfig("shipping", "yurtici");
    const config = integration.config as Record<string, unknown>;
    const customerCode = String(config.customerCode || process.env.YURTICI_CUSTOMER_CODE || "");
    const trackingCode = input.manual?.trackingCode ?? `YK${input.orderNumber.replace(/\W/g, "").slice(-10)}`;
    await writeIntegrationLog({
      settingId: integration.settingId,
      category: "shipping",
      provider: "yurtici",
      operation: "create_label",
      success: Boolean(customerCode),
      error: customerCode ? null : "Yurtiçi müşteri kodu yok; mock label üretildi."
    });
    return {
      carrier: this.displayName,
      provider: this.code,
      trackingCode,
      trackingUrl: buildYurticiTrackingUrl(trackingCode),
      labelUrl: customerCode ? `${process.env.APP_URL ?? "http://localhost:3000"}/admin/orders/${input.orderId}` : undefined,
      shipmentStatus: "label_created",
      raw: {
        mode: customerCode ? "api-ready" : "mock",
        customerCode,
        orderNumber: input.orderNumber
      }
    };
  }

  async getTrackingStatus(trackingCode: string): Promise<{ status: ShipmentStatus; raw?: unknown }> {
    return {
      status: trackingCode ? "in_transit" : "not_ready",
      raw: { carrier: this.displayName, trackingCode, mode: "mock-status-sync" }
    };
  }
}

export function getCarrierAdapter(carrier: CarrierCode = "manual"): CarrierAdapter {
  if (carrier === "yurtici") return new YurticiCargoAdapter();
  return new ManualCargoAdapter();
}

export function buildYurticiTrackingUrl(trackingCode: string) {
  return `https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${encodeURIComponent(trackingCode)}`;
}
