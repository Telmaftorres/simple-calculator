-- AlterTable
ALTER TABLE "ProductionSheet" ADD COLUMN     "packagingBoxHeightMm" INTEGER,
ADD COLUMN     "packagingBoxLengthMm" INTEGER,
ADD COLUMN     "packagingBoxWidthMm" INTEGER,
ADD COLUMN     "packagingNotes" TEXT,
ADD COLUMN     "packagingSupplierRef" TEXT;
