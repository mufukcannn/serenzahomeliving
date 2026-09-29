-- Extend internal roles for OMS/ERP operations.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'shipping';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'accounting';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'customer_service';

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "AdminModule" AS ENUM (
    'products',
    'inventory',
    'orders',
    'customers',
    'shipping',
    'marketplaces',
    'roles_permissions',
    'reports'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "PermissionAction" AS ENUM (
    'read',
    'create',
    'update',
    'delete',
    'export',
    'process'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "RolePermission" (
  "id" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "module" "AdminModule" NOT NULL,
  "actions" "PermissionAction"[] NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "RolePermission_role_module_key" ON "RolePermission"("role", "module");
CREATE INDEX IF NOT EXISTS "RolePermission_role_idx" ON "RolePermission"("role");
CREATE INDEX IF NOT EXISTS "RolePermission_module_idx" ON "RolePermission"("module");

-- Seed the default access matrix used by the admin UI and future API guards.
INSERT INTO "RolePermission" ("id", "role", "module", "actions", "updatedAt")
VALUES
  ('perm-admin-products', 'admin', 'products', ARRAY['read','create','update','delete','export','process']::"PermissionAction"[], CURRENT_TIMESTAMP),
  ('perm-admin-inventory', 'admin', 'inventory', ARRAY['read','create','update','delete','export','process']::"PermissionAction"[], CURRENT_TIMESTAMP),
  ('perm-admin-orders', 'admin', 'orders', ARRAY['read','create','update','delete','export','process']::"PermissionAction"[], CURRENT_TIMESTAMP),
  ('perm-admin-customers', 'admin', 'customers', ARRAY['read','create','update','delete','export','process']::"PermissionAction"[], CURRENT_TIMESTAMP),
  ('perm-admin-shipping', 'admin', 'shipping', ARRAY['read','create','update','delete','export','process']::"PermissionAction"[], CURRENT_TIMESTAMP),
  ('perm-admin-marketplaces', 'admin', 'marketplaces', ARRAY['read','create','update','delete','export','process']::"PermissionAction"[], CURRENT_TIMESTAMP),
  ('perm-admin-roles', 'admin', 'roles_permissions', ARRAY['read','create','update','delete','export','process']::"PermissionAction"[], CURRENT_TIMESTAMP),
  ('perm-admin-reports', 'admin', 'reports', ARRAY['read','create','update','delete','export','process']::"PermissionAction"[], CURRENT_TIMESTAMP),
  ('perm-shipping-orders', 'shipping', 'orders', ARRAY['read','update','process']::"PermissionAction"[], CURRENT_TIMESTAMP),
  ('perm-shipping-shipping', 'shipping', 'shipping', ARRAY['read','update','process']::"PermissionAction"[], CURRENT_TIMESTAMP),
  ('perm-accounting-orders', 'accounting', 'orders', ARRAY['read','export']::"PermissionAction"[], CURRENT_TIMESTAMP),
  ('perm-accounting-reports', 'accounting', 'reports', ARRAY['read','export']::"PermissionAction"[], CURRENT_TIMESTAMP),
  ('perm-customer-service-orders', 'customer_service', 'orders', ARRAY['read','update']::"PermissionAction"[], CURRENT_TIMESTAMP),
  ('perm-customer-service-customers', 'customer_service', 'customers', ARRAY['read','update']::"PermissionAction"[], CURRENT_TIMESTAMP)
ON CONFLICT ("role", "module") DO UPDATE SET
  "actions" = EXCLUDED."actions",
  "updatedAt" = CURRENT_TIMESTAMP;
