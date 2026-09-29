import { NextRequest, NextResponse } from "next/server";
import { importTrendyolOrder } from "@/lib/orders";
import { trendyolService } from "@/lib/marketplaces/trendyol";
import { prisma } from "@/lib/prisma";

const SUPPORTED_STATUSES = ["Created", "Picking", "Invoiced", "Shipped"] as const;
const DEFAULT_STATUSES = ["Created", "Picking"] as const;

type TrendyolOrderStatus = (typeof SUPPORTED_STATUSES)[number];
type TrendyolOrderResponse = {
  content?: unknown[];
  totalElements?: number;
};

export async function POST(request: NextRequest) {
  const input = await request.json().catch(() => ({}));
  const statuses = normalizeStatuses((input as { statuses?: unknown }).statuses);
  const account = await upsertTrendyolAccount();

  const syncResults = await Promise.all(
    statuses.map(async (status) => {
      try {
        const response = (await trendyolService.fetchOrders({ status, page: 0, size: 200 })) as TrendyolOrderResponse;
        const orders = Array.isArray(response.content) ? response.content : [];
        return { status, orders, totalElements: response.totalElements ?? orders.length };
      } catch (error) {
        return {
          status,
          orders: [],
          totalElements: 0,
          error: error instanceof Error ? error.message : "Trendyol siparişleri çekilemedi."
        };
      }
    })
  );

  const ordersByExternalId = new Map<string, { raw: unknown; status: TrendyolOrderStatus }>();
  for (const result of syncResults) {
    for (const raw of result.orders) {
      const externalOrderId = getExternalOrderId(raw);
      if (externalOrderId && !ordersByExternalId.has(externalOrderId)) {
        ordersByExternalId.set(externalOrderId, { raw, status: result.status });
      }
    }
  }

  const found = syncResults.reduce((sum, result) => sum + result.orders.length, 0);
  let imported = 0;
  let skipped = 0;
  const results: Array<{ externalOrderId: string; status?: string; action: "imported" | "skipped" | "failed"; orderId?: string; reason?: string }> = [];

  for (const { raw, status } of ordersByExternalId.values()) {
    const order = raw as {
      id?: string | number;
      orderNumber?: string | number;
      orderCode?: string | number;
      packageId?: string | number;
      shipmentPackageId?: string | number;
      customerFirstName?: string;
      customerLastName?: string;
      customerEmail?: string;
      shipmentAddress?: { fullAddress?: string; district?: string; city?: string; postalCode?: string; phone?: string };
      lines?: Array<{ barcode: string; quantity: number; price: number; productName: string }>;
    };
    const externalOrderId = getExternalOrderId(order);
    const externalPackageId = order.shipmentPackageId ?? order.packageId ?? order.id;
    if (!externalOrderId) {
      skipped += 1;
      results.push({ externalOrderId: "unknown", status, action: "skipped", reason: "Trendyol order id bulunamadı." });
      continue;
    }

    const existing = await prisma.order.findFirst({
      where: {
        OR: [{ externalOrderId }, { marketplaceOrder: { channel: "trendyol", externalOrderId } }]
      },
      select: { id: true }
    });
    if (existing) {
      skipped += 1;
      await prisma.marketplaceOrder.upsert({
        where: { channel_externalOrderId: { channel: "trendyol", externalOrderId } },
        update: {
          orderId: existing.id,
          externalPackageId: externalPackageId != null ? String(externalPackageId) : undefined,
          rawPayload: raw as object
        },
        create: {
          accountId: account.id,
          orderId: existing.id,
          channel: "trendyol",
          externalOrderId,
          externalPackageId: externalPackageId != null ? String(externalPackageId) : undefined,
          rawPayload: raw as object,
          importedAt: new Date()
        }
      });
      results.push({ externalOrderId, status, action: "skipped", orderId: existing.id, reason: "Sipariş zaten var." });
      continue;
    }

    try {
      const localOrder = await importTrendyolOrder({
        externalOrderId,
        customer: {
          name: `${order.customerFirstName ?? ""} ${order.customerLastName ?? ""}`.trim() || "Trendyol Musterisi",
          email: order.customerEmail ?? `trendyol-${externalOrderId}@marketplace.local`,
          phone: order.shipmentAddress?.phone
        },
        address: {
          line1: order.shipmentAddress?.fullAddress ?? "",
          district: order.shipmentAddress?.district ?? "",
          city: order.shipmentAddress?.city ?? "",
          postalCode: order.shipmentAddress?.postalCode
        },
        items:
          order.lines?.map((line) => ({
            barcode: line.barcode,
            quantity: line.quantity,
            unitPrice: line.price,
            title: line.productName
          })) ?? []
      });
      await prisma.marketplaceOrder.upsert({
        where: { channel_externalOrderId: { channel: "trendyol", externalOrderId } },
        update: {
          orderId: localOrder.id,
          externalPackageId: externalPackageId != null ? String(externalPackageId) : undefined,
          rawPayload: raw as object,
          importedAt: new Date()
        },
        create: {
          accountId: account.id,
          orderId: localOrder.id,
          channel: "trendyol",
          externalOrderId,
          externalPackageId: externalPackageId != null ? String(externalPackageId) : undefined,
          rawPayload: raw as object,
          importedAt: new Date()
        }
      });
      imported += 1;
      results.push({ externalOrderId, status, action: "imported", orderId: localOrder.id });
    } catch (error) {
      results.push({ externalOrderId, status, action: "failed", reason: error instanceof Error ? error.message : "Sipariş içe aktarılamadı." });
    }
  }

  return NextResponse.json({
    ok: true,
    statuses,
    found,
    uniqueFound: ordersByExternalId.size,
    imported,
    skipped,
    failed: results.filter((item) => item.action === "failed").length,
    statusResults: syncResults.map((result) => ({
      status: result.status,
      found: result.orders.length,
      totalElements: result.totalElements,
      error: result.error
    })),
    results
  });
}

function normalizeStatuses(input: unknown): TrendyolOrderStatus[] {
  if (!Array.isArray(input)) return [...DEFAULT_STATUSES];
  const statuses = input.filter((status): status is TrendyolOrderStatus => SUPPORTED_STATUSES.includes(status as TrendyolOrderStatus));
  return statuses.length ? Array.from(new Set(statuses)) : [...DEFAULT_STATUSES];
}

function getExternalOrderId(raw: unknown) {
  const order = raw as { orderNumber?: string | number; orderCode?: string | number; id?: string | number };
  return String(order.orderNumber ?? order.orderCode ?? order.id ?? "");
}

function upsertTrendyolAccount() {
  return prisma.marketplaceAccount.upsert({
    where: { channel_name: { channel: "trendyol", name: "Serenza Home Living Trendyol" } },
    update: {
      supplierId: process.env.TRENDYOL_SUPPLIER_ID || null,
      baseUrl: process.env.TRENDYOL_BASE_URL || "https://apigw.trendyol.com"
    },
    create: {
      channel: "trendyol",
      name: "Serenza Home Living Trendyol",
      supplierId: process.env.TRENDYOL_SUPPLIER_ID || null,
      baseUrl: process.env.TRENDYOL_BASE_URL || "https://apigw.trendyol.com"
    }
  });
}
