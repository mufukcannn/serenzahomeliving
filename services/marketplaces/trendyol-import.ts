import { Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { inferCatalogAssignment } from "@/lib/catalog-taxonomy";
import { resolveIntegrationConfig, writeIntegrationLog } from "@/lib/integrations/settings";

export type TrendyolImportProduct = {
  id?: string | number;
  title: string;
  barcode: string;
  stockCode?: string;
  quantity: number;
  salePrice: number;
  listPrice: number;
  categoryName: string;
  brand?: string;
  description?: string;
  images: string[];
  attributes: Array<{ name: string; value: string }>;
  status: "active" | "draft" | "archived";
  trendyolUrl?: string;
  raw?: unknown;
};

export type TrendyolPreviewResult = {
  products: TrendyolImportProduct[];
  page: number;
  size: number;
  totalPages?: number;
  totalElements?: number;
  credentialsMissing?: boolean;
};

export type TrendyolImportResult = {
  imported: number;
  skipped: number;
  products: Array<{ barcode: string; title: string; action: "imported" | "skipped"; reason?: string; productId?: string }>;
};

type TrendyolRawProduct = {
  id?: string | number;
  productContentId?: string | number;
  productCode?: string | number;
  productMainId?: string;
  platformListingId?: string;
  title?: string;
  barcode?: string;
  stockCode?: string;
  quantity?: number;
  salePrice?: number;
  listPrice?: number;
  dimensionalWeight?: number;
  categoryName?: string;
  brand?: string;
  description?: string;
  productUrl?: string;
  approved?: boolean;
  archived?: boolean;
  onSale?: boolean;
  images?: Array<{ url?: string } | string>;
  attributes?: Array<{
    attributeName?: string;
    attributeValue?: string;
    customAttributeValue?: string;
  }>;
};

export class TrendyolProductImportService {
  async previewProducts(input: { page?: number; size?: number; approved?: boolean } = {}): Promise<TrendyolPreviewResult> {
    const page = input.page ?? 0;
    const size = input.size ?? 50;
    const response = await this.requestProducts({ page, size, approved: input.approved });
    return {
      products: response.content.map(mapTrendyolProduct),
      page,
      size,
      totalPages: response.totalPages,
      totalElements: response.totalElements,
      credentialsMissing: response.credentialsMissing
    };
  }

  async importProducts(products: TrendyolImportProduct[]): Promise<TrendyolImportResult> {
    const result: TrendyolImportResult = { imported: 0, skipped: 0, products: [] };
    for (const product of products) {
      const imported = await this.importSingleProduct(product);
      result.products.push(imported);
      if (imported.action === "imported") result.imported += 1;
      else result.skipped += 1;
    }
    return result;
  }

  async syncStock(barcodes?: string[]) {
    const preview = await this.previewProducts({ size: 200 });
    const products = barcodes?.length ? preview.products.filter((product) => barcodes.includes(product.barcode)) : preview.products;
    const updates = [];
    for (const product of products) {
      const inventory = await prisma.inventory.findFirst({
        where: { OR: [{ sku: product.stockCode ?? product.barcode }, { variant: { barcode: product.barcode } }, { product: { barcode: product.barcode } }] }
      });
      if (!inventory) continue;
      updates.push(
        await prisma.inventory.update({
          where: { id: inventory.id },
          data: { onHand: product.quantity }
        })
      );
    }
    return { ok: true, updated: updates.length };
  }

  async syncPrice(barcodes?: string[]) {
    const preview = await this.previewProducts({ size: 200 });
    const products = barcodes?.length ? preview.products.filter((product) => barcodes.includes(product.barcode)) : preview.products;
    const updates = [];
    for (const product of products) {
      const variant = await prisma.productVariant.findFirst({ where: { barcode: product.barcode } });
      if (variant) {
        updates.push(
          await prisma.productVariant.update({
            where: { id: variant.id },
            data: {
              marketplacePrice: product.salePrice,
              basePrice: product.salePrice,
              price: product.salePrice,
              comparePrice: product.listPrice > product.salePrice ? product.listPrice : null,
              compareAtPrice: product.listPrice > product.salePrice ? product.listPrice : null
            }
          })
        );
        continue;
      }
      const existing = await prisma.product.findFirst({ where: { barcode: product.barcode } });
      if (existing) {
        updates.push(
          await prisma.product.update({
            where: { id: existing.id },
            data: {
              marketplacePrice: product.salePrice,
              basePrice: product.salePrice,
              price: product.salePrice,
              salePrice: null,
              compareAtPrice: product.listPrice > product.salePrice ? product.listPrice : null
            }
          })
        );
      }
    }
    return { ok: true, updated: updates.length };
  }

  private async importSingleProduct(input: TrendyolImportProduct): Promise<TrendyolImportResult["products"][number]> {
    const productExternalId = input.id ? String(input.id) : input.stockCode || input.barcode;
    const productSku = `TY-${productExternalId}`;
    const variantSku = input.barcode;
    const existingBarcode = await prisma.product.findFirst({
      where: {
        OR: [{ barcode: input.barcode }, { variants: { some: { OR: [{ barcode: input.barcode }, { sku: variantSku }] } } }]
      }
    });
    if (existingBarcode) {
      return { barcode: input.barcode, title: input.title, action: "skipped", reason: "Barcode already exists", productId: existingBarcode.id };
    }

    const catalog = inferCatalogAssignment({ categoryName: input.categoryName, title: input.title });
    const collection = await prisma.collection.upsert({
      where: { slug: slugify(catalog.collection) },
      update: {},
      create: {
        title: catalog.collection,
        slug: slugify(catalog.collection),
        description: `${catalog.category} ana kategorisi icin ${catalog.collection}.`,
        status: "visible"
      }
    });

    const sizes = extractAttributeValues(input.attributes, ["Ebat", "Ölçü", "Boyut", "Size"]);
    const colors = extractAttributeValues(input.attributes, ["Renk", "Color"]);
    const cachedImages = await cacheImageReferences(input.images);
    const existingProduct = await prisma.product.findFirst({
      where: {
        OR: [{ trendyolProductId: productExternalId }, { sku: productSku }]
      }
    });

    if (existingProduct) {
      const variant = await prisma.productVariant.create({
        data: {
          productId: existingProduct.id,
          size: sizes[0] ?? "Standart",
          color: colors[0] ?? "Standart",
          sku: variantSku,
          barcode: input.barcode,
          price: input.salePrice,
          marketplacePrice: input.salePrice,
          basePrice: input.salePrice,
          comparePrice: input.listPrice > input.salePrice ? input.listPrice : null,
          compareAtPrice: input.listPrice > input.salePrice ? input.listPrice : null
        }
      });

      await prisma.inventory.create({
        data: {
          productId: existingProduct.id,
          variantId: variant.id,
          sku: variantSku,
          onHand: input.quantity,
          reserved: 0,
          safety: 0
        }
      });

      await prisma.product.update({
        where: { id: existingProduct.id },
        data: {
          stock: { increment: input.quantity },
          category: catalog.category,
          collection: catalog.collection,
          collectionId: collection.id,
          sizes: mergeValues(existingProduct.sizes, sizes.length ? sizes : ["Standart"]),
          colors: mergeValues(existingProduct.colors, colors.length ? colors : ["Standart"])
        }
      });

      const account = await upsertTrendyolAccount();
      await prisma.marketplaceListing.create({
        data: {
          accountId: account.id,
          productId: existingProduct.id,
          variantId: variant.id,
          channel: "trendyol",
          externalProductId: input.id ? String(input.id) : undefined,
          externalSku: input.barcode,
          barcode: input.barcode,
          url: input.trendyolUrl,
          status: input.status === "active" ? "active" : "draft",
          lastSyncedAt: new Date()
        }
      });

      return { barcode: input.barcode, title: input.title, action: "imported", productId: existingProduct.id };
    }

    const product = await prisma.product.create({
      data: {
        title: input.title,
        slug: await uniqueProductSlug(input.title),
        collectionId: collection.id,
        collection: catalog.collection,
        category: catalog.category,
        description: input.description || input.title,
        price: input.salePrice,
        marketplacePrice: input.salePrice,
        basePrice: input.salePrice,
        salePrice: null,
        compareAtPrice: input.listPrice > input.salePrice ? input.listPrice : null,
        stock: input.quantity,
        sku: productSku,
        barcode: input.barcode,
        images: cachedImages,
        sizes: sizes.length ? sizes : ["Standart"],
        colors: colors.length ? colors : ["Standart"],
        seoTitle: `${input.title} | Serenza Home & Living`,
        seoDescription: input.description?.slice(0, 155) || `${input.title} Serenza Home & Living koleksiyonunda.`,
        attributes: input.attributes as Prisma.InputJsonValue,
        trendyolProductId: productExternalId,
        trendyolBarcode: input.barcode,
        trendyolUrl: input.trendyolUrl,
        status: input.status === "active" ? ProductStatus.active : input.status === "archived" ? ProductStatus.archived : ProductStatus.draft,
        productImages: {
          create: cachedImages.map((url, index) => ({
            url,
            alt: input.title,
            sortOrder: index,
            isPrimary: index === 0,
            isHover: index === 1
          }))
        }
      }
    });

    const variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        size: sizes[0] ?? "Standart",
        color: colors[0] ?? "Standart",
        sku: variantSku,
        barcode: input.barcode,
        price: input.salePrice,
        marketplacePrice: input.salePrice,
        basePrice: input.salePrice,
        comparePrice: input.listPrice > input.salePrice ? input.listPrice : null,
        compareAtPrice: input.listPrice > input.salePrice ? input.listPrice : null
      }
    });

    await prisma.inventory.create({
      data: {
        productId: product.id,
        variantId: variant.id,
        sku: variantSku,
        onHand: input.quantity,
        reserved: 0,
        safety: 0
      }
    });

    const account = await upsertTrendyolAccount();

    await prisma.marketplaceListing.create({
      data: {
        accountId: account.id,
        productId: product.id,
        variantId: variant.id,
        channel: "trendyol",
        externalProductId: input.id ? String(input.id) : undefined,
        externalSku: input.barcode,
        barcode: input.barcode,
        url: input.trendyolUrl,
        status: input.status === "active" ? "active" : "draft",
        lastSyncedAt: new Date()
      }
    });

    return { barcode: input.barcode, title: input.title, action: "imported", productId: product.id };
  }

  private async requestProducts(input: { page: number; size: number; approved?: boolean }) {
    const integration = await resolveIntegrationConfig("marketplace", "trendyol");
    const config = integration.config as Record<string, unknown>;
    const secrets = integration.secrets as Record<string, unknown>;
    const supplierId = String(config.supplierId || process.env.TRENDYOL_SUPPLIER_ID || "");
    const apiKey = String(secrets.apiKey || process.env.TRENDYOL_API_KEY || "");
    const apiSecret = String(secrets.apiSecret || process.env.TRENDYOL_API_SECRET || "");
    if (!supplierId || !apiKey || !apiSecret) {
      return { credentialsMissing: true, content: [], totalPages: 0, totalElements: 0 };
    }

    const search = new URLSearchParams({
      page: String(input.page),
      size: String(input.size)
    });
    if (input.approved != null) search.set("approved", String(input.approved));
    const path = `/integration/product/sellers/${supplierId}/products?${search.toString()}`;
    const response = await this.requestWithRetry(path);
    const data = response as { content?: TrendyolRawProduct[]; totalPages?: number; totalElements?: number };
    return {
      credentialsMissing: false,
      content: data.content ?? [],
      totalPages: data.totalPages,
      totalElements: data.totalElements
    };
  }

  private async requestWithRetry(path: string, attempt = 1): Promise<unknown> {
    const integration = await resolveIntegrationConfig("marketplace", "trendyol");
    const baseUrl = process.env.TRENDYOL_BASE_URL ?? "https://apigw.trendyol.com";
    const secrets = integration.secrets as Record<string, unknown>;
    const apiKey = String(secrets.apiKey || process.env.TRENDYOL_API_KEY || "");
    const apiSecret = String(secrets.apiSecret || process.env.TRENDYOL_API_SECRET || "");
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    let response: Response;

    try {
      response = await fetch(`${baseUrl}${path}`, {
        signal: controller.signal,
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
          "User-Agent": process.env.TRENDYOL_USER_AGENT ?? "SerenzaHomeLiving/1.0"
        }
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Trendyol API zaman asimina ugradi. Bilgileri kontrol edip tekrar deneyin.");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }

    if ((response.status === 429 || response.status >= 500) && attempt < 4) {
      await wait(500 * attempt);
      return this.requestWithRetry(path, attempt + 1);
    }

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    await writeIntegrationLog({
      settingId: integration.settingId,
      category: "marketplace",
      provider: "trendyol",
      operation: "product_import",
      success: response.ok,
      statusCode: response.status,
      error: response.ok ? null : text
    });
    if (!response.ok) {
      console.error("Trendyol import error", { status: response.status, body: text });
      throw new Error(`Trendyol API error ${response.status}`);
    }
    return data;
  }
}

export const trendyolProductImportService = new TrendyolProductImportService();

export function mapTrendyolProduct(raw: TrendyolRawProduct): TrendyolImportProduct {
  const images = (raw.images ?? [])
    .map((image) => (typeof image === "string" ? image : image.url))
    .filter((url): url is string => Boolean(url));
  const attributes = (raw.attributes ?? [])
    .map((attribute) => ({
      name: attribute.attributeName ?? "Özellik",
      value: attribute.attributeValue ?? attribute.customAttributeValue ?? ""
    }))
    .filter((attribute) => attribute.value);

  return {
    id: raw.productContentId ?? raw.id ?? raw.productMainId,
    title: raw.title ?? "Trendyol Ürünü",
    barcode: raw.barcode ?? raw.stockCode ?? `TY-${raw.id ?? Date.now()}`,
    stockCode: raw.stockCode,
    quantity: raw.quantity ?? 0,
    salePrice: Number(raw.salePrice ?? raw.listPrice ?? 0),
    listPrice: Number(raw.listPrice ?? raw.salePrice ?? 0),
    categoryName: raw.categoryName ?? "Trendyol",
    brand: raw.brand,
    description: raw.description,
    images,
    attributes,
    status: raw.archived ? "archived" : raw.approved === false ? "draft" : "active",
    trendyolUrl: raw.productUrl,
    raw
  };
}

async function cacheImageReferences(images: string[]) {
  // Gerçek upload/CDN aşamasında bu fonksiyon görselleri indirip WebP pipeline'a aktaracak.
  return images.length ? images : ["/brand-images/hali-kategori.jpg"];
}

function extractAttributeValues(attributes: TrendyolImportProduct["attributes"], names: string[]) {
  return Array.from(
    new Set(
      attributes
        .filter((attribute) => names.some((name) => attribute.name.toLocaleLowerCase("tr-TR").includes(name.toLocaleLowerCase("tr-TR"))))
        .map((attribute) => attribute.value)
    )
  );
}

function mergeValues(current: string[], next: string[]) {
  return Array.from(new Set([...current, ...next])).filter(Boolean);
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

async function uniqueProductSlug(title: string) {
  const base = slugify(title);
  let slug = base;
  let index = 2;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${base}-${index}`;
    index += 1;
  }
  return slug;
}

function slugify(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const mockTrendyolProducts: TrendyolRawProduct[] = [
  {
    id: "ty-demo-001",
    title: "Serenza Vintage Desenli Halı",
    barcode: "TY8680000009001",
    stockCode: "TY-SRZ-VIN-9001",
    quantity: 12,
    salePrice: 2399,
    listPrice: 2899,
    categoryName: "Halı",
    brand: "Serenza Home Living",
    description: "Trendyol mağazasından içe aktarılmaya hazır demo vintage halı.",
    approved: true,
    images: [{ url: "/brand-images/hali-kategori.jpg" }, { url: "/brand-images/hali-koleksiyon.png" }],
    attributes: [
      { attributeName: "Ebat", attributeValue: "160x230" },
      { attributeName: "Renk", attributeValue: "Krem" }
    ]
  },
  {
    id: "ty-demo-002",
    title: "Serenza Kapı Önü Paspas",
    barcode: "TY8680000009002",
    stockCode: "TY-SRZ-PAS-9002",
    quantity: 28,
    salePrice: 449,
    listPrice: 599,
    categoryName: "Paspas",
    brand: "Serenza Home Living",
    description: "Kapı önü kullanımı için Trendyol demo paspas ürünü.",
    approved: true,
    images: [{ url: "/brand-images/paspas.jpg" }, { url: "/brand-images/paspas-kategori.jpg" }],
    attributes: [
      { attributeName: "Ebat", attributeValue: "40x60" },
      { attributeName: "Renk", attributeValue: "Siyah" }
    ]
  }
];
