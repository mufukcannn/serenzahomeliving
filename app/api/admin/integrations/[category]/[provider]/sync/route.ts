import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIntegrationDefinition, IntegrationCategory } from "@/lib/integrations/registry";
import { resolveIntegrationConfig, writeIntegrationLog } from "@/lib/integrations/settings";

export async function POST(request: Request, { params }: { params: { category: IntegrationCategory; provider: string } }) {
  const guard = requireAdmin(request);
  if (guard) return guard;
  try {
    const definition = getIntegrationDefinition(params.category, params.provider);
    if (!definition || params.category !== "marketplace") return NextResponse.json({ ok: false, error: "Senkron sadece pazaryeri entegrasyonlarında kullanılabilir." }, { status: 404 });

    const setting = await resolveIntegrationConfig(params.category, params.provider);
    if (!setting.active) {
      await writeIntegrationLog({
        settingId: setting.settingId,
        category: params.category,
        provider: params.provider,
        operation: "manual_sync",
        success: false,
        error: "Entegrasyon pasif."
      });
      return NextResponse.json({ ok: false, error: "Entegrasyon pasif. Önce aktif hale getirin." }, { status: 400 });
    }

    if (setting.settingId) {
      await prisma.integrationSetting.update({
        where: { id: setting.settingId },
        data: { lastSyncAt: new Date() }
      });
    }
    await writeIntegrationLog({
      settingId: setting.settingId,
      category: params.category,
      provider: params.provider,
      operation: "manual_sync",
      success: true
    });

    return NextResponse.json({ ok: true, message: `${definition.label} senkronizasyonu başlatıldı.` });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Senkronizasyon başlatılamadı." }, { status: 500 });
  }
}

function requireAdmin(request: Request) {
  const role = request.headers.get("x-admin-role");
  if (role !== "admin") return NextResponse.json({ ok: false, error: "Bu işlem sadece Admin rolüyle yapılabilir." }, { status: 403 });
  return null;
}
