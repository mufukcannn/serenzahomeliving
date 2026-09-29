import { NextResponse } from "next/server";
import { z } from "zod";
import { CampaignDiscountType, CampaignTargetType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const campaignPatchSchema = z.object({
  name: z.string().min(2).optional(),
  discountType: z.nativeEnum(CampaignDiscountType).optional(),
  discountValue: z.number().nonnegative().optional(),
  targetType: z.nativeEnum(CampaignTargetType).optional(),
  targetValue: z.string().optional().nullable(),
  targetValues: z.array(z.string()).optional(),
  productIds: z.array(z.string()).optional(),
  variantIds: z.array(z.string()).optional(),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
  active: z.boolean().optional(),
  priority: z.number().int().optional()
}).superRefine((input, context) => {
  if (input.discountType === CampaignDiscountType.percent && input.discountValue != null && input.discountValue > 80) {
    context.addIssue({ code: "custom", path: ["discountValue"], message: "Yüzde indirim 0 ile 80 arasında olmalı." });
  }
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const input = campaignPatchSchema.parse(await request.json());
    const campaign = await prisma.pricingCampaign.update({
      where: { id: params.id },
      data: {
        ...("name" in input ? { name: input.name } : {}),
        ...("discountType" in input ? { discountType: input.discountType } : {}),
        ...("discountValue" in input ? { discountValue: input.discountValue } : {}),
        ...("targetType" in input ? { targetType: input.targetType } : {}),
        ...("targetValue" in input || "targetValues" in input ? { targetValue: encodeTargetValue(input.targetValue, input.targetValues) } : {}),
        ...("productIds" in input ? { productIds: input.productIds ?? [] } : {}),
        ...("variantIds" in input ? { variantIds: input.variantIds ?? [] } : {}),
        ...("startsAt" in input ? { startsAt: input.startsAt ? new Date(input.startsAt) : null } : {}),
        ...("endsAt" in input ? { endsAt: input.endsAt ? new Date(input.endsAt) : null } : {}),
        ...("active" in input ? { active: input.active } : {}),
        ...("priority" in input ? { priority: input.priority } : {})
      }
    });
    return NextResponse.json({ campaign });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Kampanya guncellenemedi." }, { status: 400 });
  }
}

function encodeTargetValue(targetValue?: string | null, targetValues?: string[]) {
  const values = targetValues?.filter(Boolean) ?? [];
  if (values.length > 1) return JSON.stringify(values);
  return values[0] ?? targetValue ?? null;
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  await prisma.pricingCampaign.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
