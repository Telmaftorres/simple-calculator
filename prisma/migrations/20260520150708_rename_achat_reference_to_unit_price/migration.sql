/*
  Warnings:

  - You are about to drop the column `reference` on the `ProductionAchatItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ProductionAchatItem" DROP COLUMN "reference",
ADD COLUMN     "unitPrice" DOUBLE PRECISION;
