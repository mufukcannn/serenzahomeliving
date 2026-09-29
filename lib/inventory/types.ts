import { SalesChannel } from "@/types/ecommerce";

export type InventoryReservationStatus = "active" | "committed" | "released" | "expired";

export type InventoryReservationInput = {
  inventoryId?: string;
  productId: string;
  variantId?: string;
  sku: string;
  quantity: number;
  channel: SalesChannel;
  orderId?: string;
  externalOrderId?: string;
  expiresAt?: Date;
};

export type InventoryAvailability = {
  sku: string;
  available: number;
  onHand: number;
  reserved: number;
};

export type InventorySyncTarget = {
  channel: Exclude<SalesChannel, "website">;
  sku: string;
  barcode?: string;
  quantity: number;
};
