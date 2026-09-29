import { NextResponse } from "next/server";
import { z } from "zod";
import { CampaignDiscountType, CampaignTargetType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const campaignSchema = z.object({
  name: z.string().min(2),
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

export async function GET() {
  const campaigns = await prisma.pricingCampaign.findMany({
    orderBy: [{ active: "desc" }, { priority: "desc" }, { createdAt: "desc" }]
  });
  return NextResponse.json({
    campaigns: campaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      discountType: campaign.discountType,
      discountValue: Number(campaign.discountValue),
      targetType: campaign.targetType,
      targetValue: campaign.targetValue,
      targetValues: decodeTargetValues(campaign.targetValue),
      productIds: campaign.productIds,
      variantIds: campaign.variantIds,
      startsAt: campaign.startsAt?.toISOString() ?? null,
      endsAt: campaign.endsAt?.toISOString() ?? null,
      active: campaign.active,
      priority: campaign.priority,
      createdAt: campaign.createdAt.toISOString()
    }))
  });
}

export async function POST(request: Request) {
  try {
    const input = campaignSchema.parse(await request.json());
    const campaign = await prisma.pricingCampaign.create({
      data: {
        name: input.name,
        discountType: input.discountType,
        discountValue: input.discountValue,
        targetType: input.targetType,
        targetValue: encodeTargetValue(input.targetValue, input.targetValues),
        productIds: input.productIds ?? [],
        variantIds: input.variantIds ?? [],
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
        active: input.active ?? true,
        priority: input.priority ?? 100
      }
    });
    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Kampanya olusturulamadi." }, { status: 400 });
  }
}

function encodeTargetValue(targetValue?: string | null, targetValues?: string[]) {
  const values = targetValues?.filter(Boolean) ?? [];
  if (values.length > 1) return JSON.stringify(values);
  return values[0] ?? targetValue ?? null;
}

function decodeTargetValues(targetValue?: string | null) {
  if (!targetValue) return [];
  try {
    const parsed = JSON.parse(targetValue) as unknown;
    if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [targetValue];
  }
  return [targetValue];
}
