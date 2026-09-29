-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "billing_address" TEXT,
ADD COLUMN     "billing_company" TEXT,
ADD COLUMN     "billing_name" TEXT,
ADD COLUMN     "billing_tax_number" TEXT,
ADD COLUMN     "billing_tax_office" TEXT,
ADD COLUMN     "invoice_number" TEXT,
ADD COLUMN     "invoice_status" TEXT NOT NULL DEFAULT 'not_issued',
ADD COLUMN     "invoice_type" TEXT NOT NULL DEFAULT 'individual',
ADD COLUMN     "invoice_url" TEXT;
