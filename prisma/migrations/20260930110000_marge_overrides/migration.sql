-- Marge éditable par devis, ligne par ligne (0 = pas de surcharge, on garde le réglage entreprise)
ALTER TABLE "Quote" ADD COLUMN "materialMarginOverride" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Quote" ADD COLUMN "inkMarginStandardOverride" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Quote" ADD COLUMN "inkMarginVarnishOverride" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Quote" ADD COLUMN "inkMarginFlatColorOverride" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Quote" ADD COLUMN "transportMarginOverride" DOUBLE PRECISION NOT NULL DEFAULT 0;
