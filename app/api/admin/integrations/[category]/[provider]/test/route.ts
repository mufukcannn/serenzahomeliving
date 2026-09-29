import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveIntegrationConfig, writeIntegrationLog } from "@/lib/integrations/settings";
import { getIntegrationDefinition, IntegrationCategory } from "@/lib/integrations/registry";

export async function POST(request: Request, { params }: { params: { category: IntegrationCategory; provider: string } }) {
  const guard = requireAdmin(request);
  if (guard) return guard;
  try {
    const definition = getIntegrationDefinition(params.category, params.provider);
    if (!definition) return NextResponse.json({ ok: false, error: "Entegrasyon bulunamadı." }, { status: 404 });

    const setting = await resolveIntegrationConfig(params.category, params.provider);
    const config = setting.config as Record<string, unknown>;
    const secrets = setting.secrets as Record<string, unknown>;
    const missing = requiredFields(params.category, params.provider).filter((field) => !config[field] && !secrets[field]);
    const success = missing.length === 0;
    const error = success ? null : `Eksik alanlar: ${missing.join(", ")}`;

    if (setting.settingId) {
      await prisma.integrationSetting.update({
        where: { id: setting.settingId },
        data: {
          lastTestStatus: success ? "success" : "failed",
          lastTestError: error,
          lastTestedAt: new Date(),
          lastSuccessfulAt: success ? new Date() : undefined
        }
      });
    }
    await writeIntegrationLog({
      settingId: setting.settingId,
      category: params.category,
      provider: params.provider,
      operation: "test_connection",
      success,
      error
    });

    return NextResponse.json({ ok: success, status: success ? "success" : "failed", error });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Bağlantı testi yapılamadı." }, { status: 500 });
  }
}

function requiredFields(category: IntegrationCategory, provider: string) {
  if (category === "payment" && provider === "paytr") return ["merchantId", "merchantKey", "merchantSalt"];
  if (category === "marketplace") return [provider === "trendyol" ? "supplierId" : "merchantId", "apiKey", "apiSecret"];
  if (category === "shipping") return ["customerCode", "apiUsername", "apiPassword"];
  return [];
}

function requireAdmin(request: Request) {
  const role = request.headers.get("x-admin-role");
  if (role !== "admin") return NextResponse.json({ error: "Bu işlem sadece Admin rolüyle yapılabilir." }, { status: 403 });
  return null;
}
