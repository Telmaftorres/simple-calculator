/*
  Warnings:

  - You are about to drop the column `size` on the `PackagingSupplierQuote` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PackagingSupplierQuote" DROP COLUMN "size",
ADD COLUMN     "dimDepth" DOUBLE PRECISION,
ADD COLUMN     "dimHeight" DOUBLE PRECISION,
ADD COLUMN     "dimWidth" DOUBLE PRECISION;
