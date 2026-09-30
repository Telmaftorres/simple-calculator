-- Miroir local des matières CRM : chaque matière CRM est reflétée dans une ligne Plate stable,
-- pour que Quote.plateId (clé étrangère réelle vers Plate) reste toujours valide.
ALTER TABLE "Plate" ADD COLUMN "crmMaterialId" TEXT;
CREATE UNIQUE INDEX "Plate_companyId_crmMaterialId_key" ON "Plate"("companyId", "crmMaterialId");
