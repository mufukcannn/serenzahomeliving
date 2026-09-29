import { Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Product } from "@/lib/products";
import { calculateWebPrice, CampaignInput, toNumber } from "@/lib/pricing";

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    productImages: true;
    variants: {
      include: { inventory: true };
    };
  };
}>;

export async function getPublishedProducts(input: { slug?: string } = {}) {
  const [products, campaigns] = await Promise.all([
    prisma.product.findMany({
    where: { status: ProductStatus.active },
    orderBy: { createdAt: "desc" },
    include: {
      productImages: { orderBy: { sortOrder: "asc" } },
      variants: {
        orderBy: { createdAt: "asc" },
        include: { inventory: true }
      }
    }
  }),
    prisma.pricingCampaign.findMany({ where: { active: true }, orderBy: [{ priority: "asc" }, { createdAt: "desc" }] })
  ]);
  const mapped = products.map((product) => mapStorefrontProduct(product, campaigns));
  if (!input.slug) return mapped;
  return mapped.filter((product) => slugify(product.collection) === input.slug || slugify(product.category) === input.slug);
}

export async function getPublishedProduct(slug: string) {
  const [product, campaigns] = await Promise.all([
    prisma.product.findFirst({
      where: { slug, status: ProductStatus.active },
      include: {
        productImages: { orderBy: { sortOrder: "asc" } },
        variants: {
          orderBy: { createdAt: "asc" },
          include: { inventory: true }
        }
      }
    }),
    prisma.pricingCampaign.findMany({ where: { active: true }, orderBy: [{ priority: "asc" }, { createdAt: "desc" }] })
  ]);
  return product ? mapStorefrontProduct(product, campaigns) : undefined;
}

function mapStorefrontProduct(product: ProductWithRelations, campaigns: CampaignInput[]): Product {
  const images = product.productImages.length ? product.productImages.map((image) => image.url) : product.images;
  const sizes = unique(product.variants.map((variant) => variant.size).filter(Boolean));
  const colors = unique(product.variants.map((variant) => normalizeColor(variant.color)).filter(Boolean));
  const stock = product.variants.reduce((sum, variant) => sum + Math.max(0, (variant.inventory?.onHand ?? 0) - (variant.inventory?.reserved ?? 0)), 0);
  const firstVariant = product.variants[0];
  const firstVariantPricing = firstVariant
    ? calculateWebPrice(
        {
          productId: product.id,
          variantId: firstVariant.id,
          category: product.category,
          collection: product.collection,
          marketplacePrice: toNumber(firstVariant.marketplacePrice),
          basePrice: toNumber(firstVariant.basePrice),
          webPrice: toNumber(firstVariant.webPrice),
          salePrice: toNumber(firstVariant.salePrice),
          compareAtPrice: toNumber(firstVariant.compareAtPrice ?? firstVariant.comparePrice),
          finalPrice: toNumber(firstVariant.finalPrice),
          legacyPrice: toNumber(firstVariant.price),
          legacyComparePrice: toNumber(firstVariant.comparePrice),
          manualPriceOverride: firstVariant.manualPriceOverride
        },
        campaigns
      )
    : calculateWebPrice(
        {
          productId: product.id,
          category: product.category,
          collection: product.collection,
          marketplacePrice: toNumber(product.marketplacePrice),
          basePrice: toNumber(product.basePrice),
          webPrice: toNumber(product.webPrice),
          salePrice: toNumber(product.salePrice),
          compareAtPrice: toNumber(product.compareAtPrice),
          finalPrice: toNumber(product.finalPrice),
          legacyPrice: toNumber(product.price),
          manualPriceOverride: product.manualPriceOverride
        },
        campaigns
      );

  return {
    id: product.id,
    title: product.title,
    displayTitle: product.displayTitle ?? makeDisplayTitle(product.title),
    slug: product.slug,
    collection: product.collection,
    category: product.category,
    description: stripHtml(product.description),
    price: firstVariantPricing.compareAtPrice ?? firstVariantPricing.basePrice,
    marketplacePrice: firstVariantPricing.marketplacePrice,
    basePrice: firstVariantPricing.basePrice,
    webPrice: firstVariantPricing.webPrice,
    salePrice: firstVariantPricing.compareAtPrice ? firstVariantPricing.finalPrice : undefined,
    compareAtPrice: firstVariantPricing.compareAtPrice,
    discountPercent: firstVariantPricing.discountPercent,
    finalPrice: firstVariantPricing.finalPrice,
    stock,
    sku: product.sku,
    barcode: product.barcode ?? firstVariant?.barcode ?? "",
    images: images.length ? images : ["/brand-images/hali-kategori.jpg"],
    sizes: sizes.length ? sizes : product.sizes,
    colors: colors.length ? colors : product.colors,
    seoTitle: product.seoTitle ?? product.title,
    seoDescription: product.seoDescription ?? stripHtml(product.description).slice(0, 155),
    trendyolProductId: product.trendyolProductId ?? undefined,
    trendyolBarcode: product.trendyolBarcode ?? undefined,
    trendyolUrl: product.trendyolUrl ?? undefined,
    status: product.status,
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
        title: variant.title ?? undefined,
        size: variant.size,
        color: normalizeColor(variant.color),
        sku: variant.sku,
        barcode: variant.barcode ?? undefined,
        price: pricing.finalPrice,
        marketplacePrice: pricing.marketplacePrice,
        basePrice: pricing.basePrice,
        webPrice: pricing.webPrice,
        salePrice: pricing.compareAtPrice ? pricing.finalPrice : undefined,
        compareAtPrice: pricing.compareAtPrice,
        discountPercent: pricing.discountPercent,
        finalPrice: pricing.finalPrice,
        stock: Math.max(0, (variant.inventory?.onHand ?? 0) - (variant.inventory?.reserved ?? 0)),
        images
      };
    })
  };
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function normalizeColor(value: string) {
  const parts = value.trim().split(/\s+/);
  const normalized = parts.length === 2 && parts[0].toLocaleLowerCase("tr-TR") === parts[1].toLocaleLowerCase("tr-TR") ? parts[0] : value.trim();
  const colorMap: Record<string, string> = {
    GREEN: "Yeşil",
    GREY: "Gri",
    GRAY: "Gri",
    BEIGE: "Bej",
    BLACK: "Siyah",
    WHITE: "Beyaz",
    BLUE: "Mavi",
    BROWN: "Kahverengi",
    CREAM: "Krem"
  };
  return colorMap[normalized.toLocaleUpperCase("tr-TR")] ?? normalized;
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function makeDisplayTitle(title: string) {
  return title
    .replace(/\s*\|\s*/g, " ")
    .replace(/,?\s*Kaymaz Taban,?\s*/gi, " ")
    .replace(/Yumuşak Dokulu/gi, "")
    .replace(/Oturma Odası Halısı/gi, "")
    .replace(/Yatak Odası Halısı/gi, "")
    .replace(/Salon Halısı/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugify(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
