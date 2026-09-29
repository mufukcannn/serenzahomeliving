CREATE TABLE IF NOT EXISTS "IntegrationSetting" (
  "id" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT false,
  "mode" TEXT NOT NULL DEFAULT 'test',
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "syncInterval" INTEGER,
  "config" JSONB,
  "encryptedSecrets" JSONB,
  "lastSyncAt" TIMESTAMP(3),
  "lastTestStatus" TEXT,
  "lastTestError" TEXT,
  "lastTestedAt" TIMESTAMP(3),
  "lastSuccessfulAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "IntegrationSetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "IntegrationLog" (
  "id" TEXT NOT NULL,
  "settingId" TEXT,
  "category" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "operation" TEXT NOT NULL,
  "success" BOOLEAN NOT NULL DEFAULT false,
  "statusCode" INTEGER,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "IntegrationLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "IntegrationSetting_category_provider_key" ON "IntegrationSetting"("category", "provider");
CREATE INDEX IF NOT EXISTS "IntegrationSetting_category_active_idx" ON "IntegrationSetting"("category", "active");
CREATE INDEX IF NOT EXISTS "IntegrationSetting_provider_idx" ON "IntegrationSetting"("provider");
CREATE INDEX IF NOT EXISTS "IntegrationLog_settingId_createdAt_idx" ON "IntegrationLog"("settingId", "createdAt");
CREATE INDEX IF NOT EXISTS "IntegrationLog_provider_operation_idx" ON "IntegrationLog"("provider", "operation");
CREATE INDEX IF NOT EXISTS "IntegrationLog_success_createdAt_idx" ON "IntegrationLog"("success", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'IntegrationLog_settingId_fkey'
  ) THEN
    ALTER TABLE "IntegrationLog"
      ADD CONSTRAINT "IntegrationLog_settingId_fkey"
      FOREIGN KEY ("settingId") REFERENCES "IntegrationSetting"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
