import { getAdminOrder } from "@/lib/admin-data";
import type { AdminOrder } from "@/lib/admin-data";

export type AdminShipmentPatch = {
  shippingLabelUrl?: string;
  assignedTo?: string;
  assignedUserId?: string;
  trackingCode?: string;
  trackingUrl?: string;
  shipmentStatus?: AdminOrder["shipmentStatus"];
  orderStatus?: AdminOrder["orderStatus"];
  shippedAt?: string;
};

declare global {
  var __serenzaShippingPatches: Map<string, AdminShipmentPatch> | undefined;
}

const patches = globalThis.__serenzaShippingPatches ?? new Map<string, AdminShipmentPatch>();
globalThis.__serenzaShippingPatches = patches;

export const shippingUsers = [
  { id: "shipper-001", name: "Sevkiyat Ekibi" },
  { id: "shipper-002", name: "Ayşe Paketleme" },
  { id: "shipper-003", name: "Mehmet Kargo" }
];

export function getAdminOrderWithShippingState(orderId: string) {
  const order = getAdminOrder(orderId);
  if (!order) return undefined;
  return mergeOrder(order, patches.get(order.id) ?? patches.get(order.orderNumber));
}

export function getShippingPatch(orderId: string) {
  const order = getAdminOrder(orderId);
  if (!order) return undefined;
  return patches.get(order.id) ?? patches.get(order.orderNumber);
}

export function updateShippingState(orderId: string, patch: AdminShipmentPatch) {
  const order = getAdminOrder(orderId);
  if (!order) return undefined;
  const nextPatch = { ...(patches.get(order.id) ?? {}), ...patch };
  patches.set(order.id, nextPatch);
  patches.set(order.orderNumber, nextPatch);
  return mergeOrder(order, nextPatch);
}

function mergeOrder(order: AdminOrder, patch?: AdminShipmentPatch): AdminOrder {
  if (!patch) return order;
  const timeline = [...order.timeline];
  if (patch.orderStatus === "shipped" && !timeline.some((item) => item.status === "shipped")) {
    timeline.push({
      status: "shipped",
      timestamp: patch.shippedAt ?? new Date().toLocaleString("tr-TR"),
      note: "Kargolandı işlemi tamamlandı."
    });
  }

  return {
    ...order,
    ...patch,
    timeline
  };
}

export function buildShippingLabelPdf(order: AdminOrder) {
  const lines = [
    "SERENZA HOME & LIVING",
    "KARGO ETIKETI",
    `Siparis: ${order.orderNumber}`,
    `Kanal: ${order.source}`,
    `Musteri: ${order.customer.name}`,
    `Adres: ${order.address.line1} / ${order.address.district} / ${order.address.city}`,
    `Kargo: ${order.carrier ?? "Atanmadi"}`,
    `Takip: ${order.trackingCode ?? "Bekliyor"}`
  ];
  return createSimplePdf(lines);
}

function createSimplePdf(lines: string[]) {
  const escaped = lines.map((line) => line.replace(/[()\\]/g, "\\$&"));
  const content = ["BT", "/F1 18 Tf", "50 780 Td", ...escaped.flatMap((line, index) => [index === 0 ? `(${line}) Tj` : `0 -28 Td (${line}) Tj`]), "ET"].join("\n");
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${Buffer.byteLength(content)} >> stream\n${content}\nendstream endobj`
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${object}\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf);
}
