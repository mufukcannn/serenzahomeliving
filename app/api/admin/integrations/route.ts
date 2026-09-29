import { NextResponse } from "next/server";
import { z } from "zod";
import { listIntegrationLogs, listIntegrationSettings, upsertIntegrationSetting } from "@/lib/integrations/settings";
import { IntegrationCategory } from "@/lib/integrations/registry";

export const dynamic = "force-dynamic";

const settingSchema = z.object({
  category: z.enum(["payment", "marketplace", "shipping"]),
  provider: z.string(),
  active: z.boolean(),
  mode: z.enum(["test", "live"]).default("test"),
  isDefault: z.boolean().optional(),
  syncInterval: z.number().int().positive().nullable().optional(),
  config: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
  secrets: z.record(z.string()).optional()
});

export async function GET(request: Request) {
  const guard = requireAdmin(request);
  if (guard) return guard;
  try {
    const integrations = await listIntegrationSettings();
    const logs = await listIntegrationLogs(50);
    return NextResponse.json(groupedResponse(integrations, logs));
  } catch (error) {
    return NextResponse.json(
      {
        payments: [],
        marketplaces: [],
        shipping: [],
        integrations: [],
        logs: [],
        error: error instanceof Error ? error.message : "Entegrasyonlar alınamadı."
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const guard = requireAdmin(request);
  if (guard) return guard;
  try {
    const body = await readJsonBody(request);
    const input = settingSchema.parse(body);
    const setting = await upsertIntegrationSetting({
      category: input.category as IntegrationCategory,
      provider: input.provider,
      active: input.active,
      mode: input.mode,
      isDefault: input.isDefault,
      syncInterval: input.syncInterval,
      config: input.config,
      secrets: input.secrets
    });
    return NextResponse.json({ ok: true, id: setting.id });
  } catch (error) {
    const status = error instanceof SyntaxError || error instanceof z.ZodError ? 400 : 500;
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Entegrasyon kaydedilemedi." }, { status });
  }
}

function requireAdmin(request: Request) {
  const role = request.headers.get("x-admin-role");
  if (role !== "admin") return NextResponse.json({ error: "Bu ekrana sadece Admin rolü erişebilir." }, { status: 403 });
  return null;
}

async function readJsonBody(request: Request) {
  const text = await request.text();
  if (!text.trim()) throw new SyntaxError("Boş istek gövdesi gönderildi.");
  return JSON.parse(text);
}

function groupedResponse(integrations: Awaited<ReturnType<typeof listIntegrationSettings>>, logs: Awaited<ReturnType<typeof listIntegrationLogs>>) {
  return {
    payments: integrations.filter((integration) => integration.category === "payment"),
    marketplaces: integrations.filter((integration) => integration.category === "marketplace"),
    shipping: integrations.filter((integration) => integration.category === "shipping"),
    integrations,
    logs
  };
}
