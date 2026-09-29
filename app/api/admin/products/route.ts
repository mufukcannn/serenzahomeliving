import { NextResponse } from "next/server";
import { Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AdminProductStatus } from "@/lib/admin-data";
import { calculateWebPrice, toNumber } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        productImages: { orderBy: { sortOrder: "asc" } },
        variants: {
          orderBy: { createdAt: "asc" },
          include: { inventory: true }
        }
      }
    });

    const campaigns = await prisma.pricingCampaign.findMany({ where: { active: true }, orderBy: [{ priority: "asc" }, { createdAt: "desc" }] });
    return NextResponse.json({ products: products.map((product) => mapProduct(product, campaigns)) });
  } catch (error) {
    return NextResponse.json(
      { products: [], error: error instanceof Error ? error.message : "Urun katalogu yuklenemedi." },
      { status: 500 }
    );
  }
}

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    productImages: true;
    variants: {
      include: { inventory: true };
    };
  };
}>;

function mapProduct(product: ProductWithRelations, campaigns: Awaited<ReturnType<typeof prisma.pricingCampaign.findMany>>) {
  const images = product.productImages.length ? product.productImages.map((image) => image.url) : product.images;
  const hoverImage = product.productImages.find((image) => image.isHover)?.url ?? images[1] ?? images[0];
  const attributes = normalizeAttributes(Array.isArray(product.attributes) ? (product.attributes as Array<{ name: string; value: string }>) : []);

  return {
    id: product.id,
    title: product.title,
    displayTitle: product.displayTitle ?? undefined,
    slug: product.slug,
    collection: product.collection,
    category: product.category,
    status: mapStatus(product.status),
    images,
    hoverImage,
    seoTitle: product.seoTitle ?? undefined,
    seoDescription: product.seoDescription ?? undefined,
    imageAltText: product.productImages[0]?.alt ?? `${product.title} ürün görseli`,
    feedEnabled: product.feedEnabled,
    feedTitle: product.feedTitle ?? product.title,
    feedDescription: product.feedDescription ?? product.seoDescription ?? undefined,
    feedCategory: product.feedCategory ?? `${product.category} > ${product.collection}`,
    googleProductCategory: product.googleProductCategory ?? undefined,
    feedImage: product.feedImageId ? images[0] : images[0],
    attributes,
    variants: product.variants.map((variant) => {
      const pricing = calculateWebPrice(
        {
          productId: product.id,
          variantId: variant.id,
          category: product.category,
          collection: product.collection,
          marketplacePrice: toNumber(variant.marketplacePrice),
          basePrice: toNumber(variant.basePrice),
          webPrice: toNumber(variant.webPrice),
          salePrice: toNumber(variant.salePrice),
          compareAtPrice: toNumber(variant.compareAtPrice ?? variant.comparePrice),
          finalPrice: toNumber(variant.finalPrice),
          legacyPrice: toNumber(variant.price),
          legacyComparePrice: toNumber(variant.comparePrice),
          manualPriceOverride: variant.manualPriceOverride
        },
        campaigns
      );

      return {
        id: variant.id,
        size: variant.size,
        color: variant.color,
        stock: Math.max(0, (variant.inventory?.onHand ?? 0) - (variant.inventory?.reserved ?? 0)),
        sku: variant.sku,
        price: pricing.finalPrice,
        marketplacePrice: pricing.marketplacePrice,
        basePrice: pricing.basePrice,
        webPrice: pricing.webPrice,
        salePrice: pricing.salePrice,
        comparePrice: pricing.compareAtPrice,
        compareAtPrice: pricing.compareAtPrice,
        discountPercent: pricing.discountPercent,
        finalPrice: pricing.finalPrice,
        campaignName: pricing.campaignName
      };
    })
  };
}

function mapStatus(status: ProductStatus): AdminProductStatus {
  if (status === "draft") return "draft";
  if (status === "archived") return "archived";
  return "published";
}

function normalizeAttributes(attributes: Array<{ name: string; value: string }>) {
  const grouped = new Map<string, string[]>();

  for (const attribute of attributes) {
    const name = attribute.name.trim();
    const value = cleanAttributeValue(attribute.value);
    if (!name || !value) continue;

    const current = grouped.get(name) ?? [];
    if (!current.some((item) => valuesMatch(item, value))) current.push(value);
    grouped.set(name, current);
  }

  return Array.from(grouped.entries()).map(([name, values]) => ({
    name,
    value: values.join(" / ")
  }));
}

function cleanAttributeValue(value: string) {
  const trimmed = value.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length === 2 && parts[0].toLocaleLowerCase("tr-TR") === parts[1].toLocaleLowerCase("tr-TR")) {
    return parts[0];
  }
  return trimmed;
}

function valuesMatch(left: string, right: string) {
  return left.toLocaleLowerCase("tr-TR") === right.toLocaleLowerCase("tr-TR");
}
