import { NextResponse } from "next/server";
import { z } from "zod";
import { CampaignDiscountType, CampaignTargetType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateWebPrice, CampaignInput, toNumber } from "@/lib/pricing";

const previewSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).default("Önizleme"),
  discountType: z.nativeEnum(CampaignDiscountType),
  discountValue: z.number().nonnegative(),
  targetType: z.nativeEnum(CampaignTargetType),
  targetValue: z.string().optional().nullable(),
  targetValues: z.array(z.string()).optional(),
  productIds: z.array(z.string()).optional(),
  variantIds: z.array(z.string()).optional(),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
  active: z.boolean().optional(),
  priority: z.number().int().optional()
}).superRefine((input, context) => {
  if (input.discountType === CampaignDiscountType.percent && input.discountValue > 80) {
    context.addIssue({ code: "custom", path: ["discountValue"], message: "Yüzde indirim 0 ile 80 arasında olmalı." });
  }
});

type ProductForPreview = Prisma.ProductGetPayload<{
  include: {
    variants: { include: { inventory: true } };
  };
}>;

export async function POST(request: Request) {
  try {
    const input = previewSchema.parse(await request.json());
    const [products, existingCampaigns] = await Promise.all([
      prisma.product.findMany({
        where: { status: "active" },
        include: { variants: { include: { inventory: true } } }
      }),
      prisma.pricingCampaign.findMany({ where: input.id ? { id: { not: input.id } } : undefined })
    ]);

    const draftCampaign: CampaignInput = {
      id: input.id ?? "preview",
      name: input.name,
      discountType: input.discountType,
      discountValue: new Prisma.Decimal(input.discountValue),
      targetType: input.targetType,
      targetValue: input.targetValue ?? null,
      targetValues: input.targetValues ?? [],
      productIds: input.productIds ?? [],
      variantIds: input.variantIds ?? [],
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      active: input.active ?? true,
      priority: input.priority ?? 100,
      createdAt: new Date()
    };
    const campaigns = [...existingCampaigns, draftCampaign];

    let affectedProducts = 0;
    let affectedVariants = 0;
    let oldTotal = 0;
    let newTotal = 0;
    const productIds = new Set<string>();

    for (const product of products) {
      const variants = product.variants.length ? product.variants : [null];
      for (const variant of variants) {
        const before = calculateLine(product, variant, existingCampaigns);
        const after = calculateLine(product, variant, campaigns);
        if (after.campaignId !== draftCampaign.id) continue;
        productIds.add(product.id);
        affectedVariants += variant ? 1 : 0;
        oldTotal += before.finalPrice;
        newTotal += after.finalPrice;
      }
    }

    affectedProducts = productIds.size;
    return NextResponse.json({
      preview: {
        affectedProducts,
        affectedVariants,
        averageOldPrice: affectedVariants ? round(oldTotal / affectedVariants) : 0,
        averageNewPrice: affectedVariants ? round(newTotal / affectedVariants) : 0,
        totalDiscountImpact: round(Math.max(0, oldTotal - newTotal))
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Önizleme hesaplanamadı." }, { status: 400 });
  }
}

function calculateLine(product: ProductForPreview, variant: ProductForPreview["variants"][number] | null, campaigns: CampaignInput[]) {
  return calculateWebPrice(
    {
      productId: product.id,
      variantId: variant?.id,
      category: product.category,
      collection: product.collection,
      marketplacePrice: toNumber(variant?.marketplacePrice ?? product.marketplacePrice),
      basePrice: toNumber(variant?.basePrice ?? product.basePrice),
      webPrice: toNumber(variant?.webPrice ?? product.webPrice),
      salePrice: toNumber(variant?.salePrice ?? product.salePrice),
      compareAtPrice: toNumber(variant?.compareAtPrice ?? variant?.comparePrice ?? product.compareAtPrice),
      finalPrice: toNumber(variant?.finalPrice ?? product.finalPrice),
      legacyPrice: toNumber(variant?.price ?? product.price),
      legacyComparePrice: toNumber(variant?.comparePrice),
      manualPriceOverride: variant?.manualPriceOverride ?? product.manualPriceOverride
    },
    campaigns
  );
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
