-- AlterTable
ALTER TABLE "ProductTemplate" ADD COLUMN     "accessoriesMargePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "packagingMargePercent" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "accessoriesMargePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "packagingMargePercent" DOUBLE PRECISION NOT NULL DEFAULT 0;
