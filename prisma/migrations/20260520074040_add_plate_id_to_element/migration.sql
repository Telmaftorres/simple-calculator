-- AlterTable
ALTER TABLE "ProductionProductLineElement" ADD COLUMN     "plateId" INTEGER;

-- AddForeignKey
ALTER TABLE "ProductionProductLineElement" ADD CONSTRAINT "ProductionProductLineElement_plateId_fkey" FOREIGN KEY ("plateId") REFERENCES "Plate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
