-- DropForeignKey
ALTER TABLE "Element" DROP CONSTRAINT "Element_productTypeId_fkey";

-- AddForeignKey
ALTER TABLE "Element" ADD CONSTRAINT "Element_productTypeId_fkey" FOREIGN KEY ("productTypeId") REFERENCES "ProductType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
