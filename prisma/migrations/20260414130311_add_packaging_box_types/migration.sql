-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "packagingBoxType" TEXT,
ADD COLUMN     "packagingExternalSize" TEXT,
ADD COLUMN     "packagingMaterialType" TEXT,
ADD COLUMN     "packagingProductHeight" INTEGER,
ADD COLUMN     "packagingProductLength" INTEGER,
ADD COLUMN     "packagingProductThickness" INTEGER,
ADD COLUMN     "packagingProductWidth" INTEGER;
