-- Vernis en ml/plaque : nouveau champ, rétro-compatible (0 = ancienne formule % conservée par le calcul)
ALTER TABLE "ProductTemplate" ADD COLUMN "varnishMlPerPlate" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "ProductTemplateElement" ADD COLUMN "varnishMlPerPlate" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Quote" ADD COLUMN "varnishMlPerPlate" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "QuoteAmalgameRun" ADD COLUMN "varnishMlPerPlate" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "QuoteProduct" ADD COLUMN "varnishMlPerPlate" DOUBLE PRECISION NOT NULL DEFAULT 0;
