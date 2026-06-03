-- CreateTable Company
CREATE TABLE "Company" (
  "id"        SERIAL PRIMARY KEY,
  "name"      TEXT NOT NULL,
  "slug"      TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- Créer la company Kontfeel (toutes les données existantes lui seront rattachées)
INSERT INTO "Company" ("name", "slug", "createdAt", "updatedAt")
VALUES ('Kontfeel', 'kontfeel', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- AlterTable: ajout de companyId (nullable) sur tous les modèles
ALTER TABLE "Study"                 ADD COLUMN "companyId" INTEGER REFERENCES "Company"("id");
ALTER TABLE "Quote"                 ADD COLUMN "companyId" INTEGER REFERENCES "Company"("id");
ALTER TABLE "Plate"                 ADD COLUMN "companyId" INTEGER REFERENCES "Company"("id");
ALTER TABLE "Accessory"             ADD COLUMN "companyId" INTEGER REFERENCES "Company"("id");
ALTER TABLE "Consumable"            ADD COLUMN "companyId" INTEGER REFERENCES "Company"("id");
ALTER TABLE "ProductType"           ADD COLUMN "companyId" INTEGER REFERENCES "Company"("id");
ALTER TABLE "PackagingSupplierQuote" ADD COLUMN "companyId" INTEGER REFERENCES "Company"("id");
ALTER TABLE "PackagingPricingRule"  ADD COLUMN "companyId" INTEGER REFERENCES "Company"("id");
ALTER TABLE "QuantityCoefficient"   ADD COLUMN "companyId" INTEGER REFERENCES "Company"("id");
ALTER TABLE "Setting"               ADD COLUMN "companyId" INTEGER REFERENCES "Company"("id");
ALTER TABLE "User"                  ADD COLUMN "companyId" INTEGER REFERENCES "Company"("id");
ALTER TABLE "AuditLog"              ADD COLUMN "companyId" INTEGER REFERENCES "Company"("id");
ALTER TABLE "TransportShipment"     ADD COLUMN "companyId" INTEGER REFERENCES "Company"("id");

-- Backfill: rattacher toutes les données existantes à Kontfeel
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
