/*
  Warnings:

  - You are about to drop the column `material` on the `ProductionProductLine` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ProductionProductLine" DROP COLUMN "material",
ADD COLUMN     "plateId" INTEGER;

-- AddForeignKey
ALTER TABLE "ProductionProductLine" ADD CONSTRAINT "ProductionProductLine_plateId_fkey" FOREIGN KEY ("plateId") REFERENCES "Plate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
