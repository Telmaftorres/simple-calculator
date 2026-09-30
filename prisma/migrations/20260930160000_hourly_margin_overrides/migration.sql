-- Coefficient de marge éditable par devis pour les postes au taux horaire (0 = coefficient des réglages)
ALTER TABLE "Quote" ADD COLUMN "printMarginOverride" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Quote" ADD COLUMN "cuttingMarginOverride" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Quote" ADD COLUMN "assemblyMarginOverride" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Quote" ADD COLUMN "conditioningMarginOverride" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Quote" ADD COLUMN "packagingCuttingMarginOverride" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Quote" ADD COLUMN "beMarginOverride" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Quote" ADD COLUMN "batMarginOverride" DOUBLE PRECISION NOT NULL DEFAULT 0;
