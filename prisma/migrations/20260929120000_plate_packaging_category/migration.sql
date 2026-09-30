-- Catégorie emballage explicite sur les plaques (B / EB / C / BC)
-- Remplace la déduction fragile par analyse du texte libre "material"
ALTER TABLE "Plate" ADD COLUMN "packagingCategory" TEXT;
