-- Phase 2 : isolation multi-tenant
-- Pré-requis : Phase 1 a backfillé companyId sur toutes les tables

-- ── 1. Backfill final (sécurité : rattraper tout NULL restant) ──
DO $$
DECLARE kontfeel_id INTEGER;
BEGIN
  SELECT id INTO kontfeel_id FROM "Company" WHERE slug = 'kontfeel';

  UPDATE "Study"                  SET "companyId" = kontfeel_id WHERE "companyId" IS NULL;
  UPDATE "Quote"                  SET "companyId" = kontfeel_id WHERE "companyId" IS NULL;
  UPDATE "Plate"                  SET "companyId" = kontfeel_id WHERE "companyId" IS NULL;
  UPDATE "Accessory"              SET "companyId" = kontfeel_id WHERE "companyId" IS NULL;
  UPDATE "Consumable"             SET "companyId" = kontfeel_id WHERE "companyId" IS NULL;
  UPDATE "ProductType"            SET "companyId" = kontfeel_id WHERE "companyId" IS NULL;
  UPDATE "PackagingSupplierQuote" SET "companyId" = kontfeel_id WHERE "companyId" IS NULL;
  UPDATE "PackagingPricingRule"   SET "companyId" = kontfeel_id WHERE "companyId" IS NULL;
  UPDATE "QuantityCoefficient"    SET "companyId" = kontfeel_id WHERE "companyId" IS NULL;
  UPDATE "Setting"                SET "companyId" = kontfeel_id WHERE "companyId" IS NULL;
  UPDATE "User"                   SET "companyId" = kontfeel_id WHERE "companyId" IS NULL;
  UPDATE "AuditLog"               SET "companyId" = kontfeel_id WHERE "companyId" IS NULL;
  UPDATE "TransportShipment"      SET "companyId" = kontfeel_id WHERE "companyId" IS NULL;
END $$;

-- ── 2. Rendre companyId NOT NULL ──
ALTER TABLE "Study"                 ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Quote"                 ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Plate"                 ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Accessory"             ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Consumable"            ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "ProductType"           ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "PackagingSupplierQuote" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "PackagingPricingRule"  ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "QuantityCoefficient"   ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Setting"               ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "User"                  ALTER COLUMN "companyId" SET NOT NULL;

-- ── 3. Supprimer les anciennes contraintes globales ──
DROP INDEX IF EXISTS "Study_number_key";
DROP INDEX IF EXISTS "Plate_name_key";
DROP INDEX IF EXISTS "ProductType_name_key";
DROP INDEX IF EXISTS "Setting_key_key";
DROP INDEX IF EXISTS "QuantityCoefficient_quantityBand_key";
DROP INDEX IF EXISTS "PackagingPricingRule_category_material_size_key";

-- ── 4. Ajouter les contraintes composites (par company) ──
CREATE UNIQUE INDEX "Study_number_companyId_key"            ON "Study"("number", "companyId");
CREATE UNIQUE INDEX "Plate_name_companyId_key"              ON "Plate"("name", "companyId");
CREATE UNIQUE INDEX "ProductType_name_companyId_key"        ON "ProductType"("name", "companyId");
CREATE UNIQUE INDEX "Setting_key_companyId_key"             ON "Setting"("key", "companyId");
CREATE UNIQUE INDEX "QuantityCoeff_band_companyId_key"      ON "QuantityCoefficient"("quantityBand", "companyId");
CREATE UNIQUE INDEX "PackagingRule_cat_mat_size_company_key" ON "PackagingPricingRule"("category", "material", "size", "companyId");

-- ── 5. Seed settings Telma (copie depuis Kontfeel) ──
INSERT INTO "Setting" ("key", "value", "label", "unit", "companyId", "createdAt", "updatedAt")
SELECT
  s."key",
  s."value",
  s."label",
  s."unit",
  (SELECT id FROM "Company" WHERE slug = 'telma'),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Setting" s
WHERE s."companyId" = (SELECT id FROM "Company" WHERE slug = 'kontfeel')
  AND s."key" NOT IN ('CRM_OUTBOUND_KEY', 'CRM_API_KEY')
ON CONFLICT ("key", "companyId") DO NOTHING;
