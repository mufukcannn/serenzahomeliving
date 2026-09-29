import { CampaignDiscountType, CampaignTargetType, Prisma } from "@prisma/client";

export type PricingSubject = {
  productId: string;
  variantId?: string;
  category: string;
  collection: string;
  marketplacePrice?: number | null;
  basePrice?: number | null;
  webPrice?: number | null;
  salePrice?: number | null;
  compareAtPrice?: number | null;
  finalPrice?: number | null;
  legacyPrice?: number | null;
  legacyComparePrice?: number | null;
  manualPriceOverride?: boolean | null;
};

export type PricingResult = {
  marketplacePrice: number;
  basePrice: number;
  webPrice: number;
  salePrice: number;
  compareAtPrice?: number;
  discountPercent?: number;
  finalPrice: number;
  campaignId?: string;
  campaignName?: string;
};

export type CampaignInput = {
  id: string;
  name: string;
  discountType: CampaignDiscountType;
  discountValue: Prisma.Decimal | number | string;
  targetType: CampaignTargetType;
  targetValue?: string | null;
  targetValues?: string[];
  productIds: string[];
  variantIds: string[];
  startsAt?: Date | null;
  endsAt?: Date | null;
  active: boolean;
  priority: number;
  createdAt: Date;
};

export function calculateWebPrice(subject: PricingSubject, campaigns: CampaignInput[] = [], now = new Date()): PricingResult {
  const marketplacePrice = money(
    subject.marketplacePrice ??
      subject.basePrice ??
      subject.legacyComparePrice ??
      subject.legacyPrice ??
      subject.webPrice ??
      subject.salePrice ??
      subject.finalPrice ??
      0
  );
  const basePrice = money(subject.basePrice ?? marketplacePrice);
  const overridePrice = subject.webPrice ?? subject.salePrice ?? subject.finalPrice;

  if (subject.manualPriceOverride && overridePrice != null) {
    const finalPrice = money(Math.max(1, overridePrice));
    return {
      marketplacePrice,
      basePrice,
      webPrice: finalPrice,
      salePrice: finalPrice,
      compareAtPrice: basePrice > finalPrice ? basePrice : undefined,
      discountPercent: calculateDiscountPercent(basePrice, finalPrice),
      finalPrice
    };
  }

  const campaign = campaigns
    .filter((item) => campaignApplies(item, subject, now))
    .sort((left, right) => right.priority - left.priority || right.createdAt.getTime() - left.createdAt.getTime())
    [0];

  const finalPrice = campaign ? applyDiscount(basePrice, campaign.discountType, Number(campaign.discountValue)) : basePrice;
  const compareAtPrice = finalPrice < basePrice ? basePrice : undefined;

  return {
    marketplacePrice,
    basePrice,
    webPrice: finalPrice,
    salePrice: finalPrice,
    compareAtPrice,
    discountPercent: calculateDiscountPercent(basePrice, finalPrice),
    finalPrice,
    campaignId: campaign?.id,
    campaignName: campaign?.name
  };
}

export function toNumber(value: Prisma.Decimal | number | string | null | undefined) {
  if (value == null) return undefined;
  return Number(value);
}

function campaignApplies(campaign: CampaignInput, subject: PricingSubject, now: Date) {
  if (!campaign.active) return false;
  if (campaign.startsAt && campaign.startsAt > now) return false;
  if (campaign.endsAt && campaign.endsAt < now) return false;

  if (campaign.targetType === CampaignTargetType.all) return true;
  if (campaign.targetType === CampaignTargetType.category) return matchesAny(campaignTargetValues(campaign), subject.category);
  if (campaign.targetType === CampaignTargetType.collection) return matchesAny(campaignTargetValues(campaign), subject.collection);
  if (campaign.targetType === CampaignTargetType.product) return campaign.productIds.includes(subject.productId) || campaign.targetValue === subject.productId;
  if (campaign.targetType === CampaignTargetType.variant) return Boolean(subject.variantId && (campaign.variantIds.includes(subject.variantId) || campaign.targetValue === subject.variantId));
  return false;
}

function applyDiscount(basePrice: number, type: CampaignDiscountType, value: number) {
  if (type === CampaignDiscountType.percent) return money(Math.max(1, basePrice * (1 - clamp(value, 0, 80) / 100)));
  return money(Math.max(1, basePrice - Math.max(0, value)));
}

function calculateDiscountPercent(basePrice: number, finalPrice: number) {
  if (basePrice <= 0 || finalPrice >= basePrice) return undefined;
  return Math.round(((basePrice - finalPrice) / basePrice) * 10000) / 100;
}

function money(value: number) {
  return Math.round(value * 100) / 100;
}

function same(left?: string | null, right?: string | null) {
  return (left ?? "").toLocaleLowerCase("tr-TR") === (right ?? "").toLocaleLowerCase("tr-TR");
}

function matchesAny(values: Array<string | null | undefined>, value: string) {
  return values.filter(Boolean).some((item) => same(item, value));
}

function campaignTargetValues(campaign: CampaignInput) {
  if (campaign.targetValues?.length) return campaign.targetValues;
  if (!campaign.targetValue) return [];
  try {
    const parsed = JSON.parse(campaign.targetValue) as unknown;
    if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [campaign.targetValue];
  }
  return [campaign.targetValue];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
