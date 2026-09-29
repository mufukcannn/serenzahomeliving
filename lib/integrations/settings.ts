import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret, maskSecret } from "@/lib/integrations/crypto";
import { getIntegrationDefinition, integrationDefinitions, IntegrationCategory } from "@/lib/integrations/registry";

type SecretMap = Record<string, string>;
type ConfigMap = Record<string, string | number | boolean | null>;

export async function listIntegrationSettings() {
  const settings = await prisma.integrationSetting
    .findMany({
      orderBy: [{ category: "asc" }, { provider: "asc" }],
      include: { logs: { orderBy: { createdAt: "desc" }, take: 5 } }
    })
    .catch(() => []);
  const existing = new Map(settings.map((setting) => [`${setting.category}:${setting.provider}`, setting]));

  return integrationDefinitions.map((definition) => {
    const setting = existing.get(`${definition.category}:${definition.provider}`);
    const config = readConfig(setting?.config);
    const encryptedSecrets = readSecrets(setting?.encryptedSecrets);
    const secretValues = Object.fromEntries(Object.entries(encryptedSecrets).map(([key, value]) => [key, decryptSecret(value) ?? ""]));
    const envConfig = setting ? {} : readEnvConfig(definition);
    const envSecrets = setting ? {} : readEnvSecrets(definition);
    return {
      id: setting?.id,
      category: definition.category,
      provider: definition.provider,
      label: setting?.label ?? definition.label,
      active: setting?.active ?? Boolean(Object.keys(envConfig).length || Object.keys(envSecrets).length),
      mode: setting?.mode ?? (process.env[definition.env.testMode] === "0" ? "live" : "test"),
      isDefault: setting?.isDefault ?? false,
      syncInterval: setting?.syncInterval ?? (Number(config.syncInterval ?? 0) || null),
      config: { ...envConfig, ...config },
      secretMasks: Object.fromEntries(definition.secretFields.map((field) => [field, maskSecret(secretValues[field] || envSecrets[field])])),
      lastSyncAt: setting?.lastSyncAt?.toISOString() ?? null,
      lastTestStatus: setting?.lastTestStatus ?? null,
      lastTestError: setting?.lastTestError ?? null,
      lastTestedAt: setting?.lastTestedAt?.toISOString() ?? null,
      lastSuccessfulAt: setting?.lastSuccessfulAt?.toISOString() ?? null,
      logs: setting?.logs.map((log) => ({
        id: log.id,
        provider: log.provider,
        operation: log.operation,
        success: log.success,
        error: log.error,
        createdAt: log.createdAt.toISOString()
      })) ?? []
    };
  });
}

export async function listIntegrationLogs(limit = 50) {
  const logs = await prisma.integrationLog
    .findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        category: true,
        provider: true,
        operation: true,
        success: true,
        statusCode: true,
        error: true,
        createdAt: true
      }
    })
    .catch(() => []);

  return logs.map((log) => ({
    ...log,
    createdAt: log.createdAt.toISOString()
  }));
}

export async function upsertIntegrationSetting(input: {
  category: IntegrationCategory;
  provider: string;
  active: boolean;
  mode: string;
  isDefault?: boolean;
  syncInterval?: number | null;
  config?: ConfigMap;
  secrets?: SecretMap;
}) {
  const definition = getIntegrationDefinition(input.category, input.provider);
  if (!definition) throw new Error("Integration definition not found.");
  const existing = await prisma.integrationSetting.findUnique({ where: { category_provider: { category: input.category, provider: input.provider } } });
  const currentSecrets = readSecrets(existing?.encryptedSecrets);
  const nextSecrets = { ...currentSecrets };
  for (const field of definition.secretFields) {
    const value = input.secrets?.[field]?.trim();
    if (value) nextSecrets[field] = encryptSecret(value);
  }

  return prisma.integrationSetting.upsert({
    where: { category_provider: { category: input.category, provider: input.provider } },
    create: {
      category: input.category,
      provider: input.provider,
      label: definition.label,
      active: input.active,
      mode: input.mode,
      isDefault: Boolean(input.isDefault),
      syncInterval: input.syncInterval ?? null,
      config: sanitizeConfig(input.config) as Prisma.InputJsonValue,
      encryptedSecrets: nextSecrets as Prisma.InputJsonValue
    },
    update: {
      active: input.active,
      mode: input.mode,
      isDefault: Boolean(input.isDefault),
      syncInterval: input.syncInterval ?? null,
      config: sanitizeConfig(input.config) as Prisma.InputJsonValue,
      encryptedSecrets: nextSecrets as Prisma.InputJsonValue
    }
  });
}

export async function resolveIntegrationConfig(category: IntegrationCategory, provider: string) {
  const definition = getIntegrationDefinition(category, provider);
  if (!definition) return { active: false, mode: "test", config: {}, secrets: {} };
  const setting = await prisma.integrationSetting.findUnique({ where: { category_provider: { category, provider } } }).catch(() => null);
  const config = readConfig(setting?.config);
  const encryptedSecrets = readSecrets(setting?.encryptedSecrets);
  const secrets = Object.fromEntries(Object.entries(encryptedSecrets).map(([key, value]) => [key, decryptSecret(value) ?? ""]));
  if (!setting) {
    Object.assign(config, readEnvConfig(definition));
    Object.assign(secrets, readEnvSecrets(definition));
  }

  return {
    active: setting?.active ?? Boolean(Object.values(definition.env).some((envName) => process.env[envName])),
    mode: setting?.mode ?? (process.env[definition.env.testMode] === "0" ? "live" : "test"),
    isDefault: setting?.isDefault ?? false,
    syncInterval: setting?.syncInterval ?? (Number(config.syncInterval ?? 0) || null),
    config,
    secrets,
    settingId: setting?.id
  };
}

export async function writeIntegrationLog(input: {
  settingId?: string | null;
  category: string;
  provider: string;
  operation: string;
  success: boolean;
  statusCode?: number;
  error?: string | null;
}) {
  return prisma.integrationLog.create({ data: input }).catch(() => null);
}

function readConfig(value: Prisma.JsonValue | null | undefined): ConfigMap {
  return isRecord(value) ? (value as ConfigMap) : {};
}

function readSecrets(value: Prisma.JsonValue | null | undefined): SecretMap {
  return isRecord(value) ? (value as SecretMap) : {};
}

function sanitizeConfig(config?: ConfigMap) {
  const cleaned: ConfigMap = {};
  for (const [key, value] of Object.entries(config ?? {})) {
    if (value === "") continue;
    cleaned[key] = value;
  }
  return cleaned;
}

function readEnvConfig(definition: { env: Record<string, string>; secretFields: string[] }) {
  const config: ConfigMap = {};
  for (const [key, envName] of Object.entries(definition.env)) {
    if (key === "testMode" || definition.secretFields.includes(key)) continue;
    if (process.env[envName]) config[key] = process.env[envName] ?? null;
  }
  return config;
}

function readEnvSecrets(definition: { env: Record<string, string>; secretFields: string[] }) {
  const secrets: SecretMap = {};
  for (const field of definition.secretFields) {
    const envName = definition.env[field];
    if (envName && process.env[envName]) secrets[field] = process.env[envName] ?? "";
  }
  return secrets;
}

function isRecord(value: unknown): value is Record<string, string> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
