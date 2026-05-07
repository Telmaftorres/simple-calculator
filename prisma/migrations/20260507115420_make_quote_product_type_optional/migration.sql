-- DropForeignKey
ALTER TABLE "Quote" DROP CONSTRAINT "Quote_productTypeId_fkey";

-- AlterTable
ALTER TABLE "Quote" ALTER COLUMN "productTypeId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_productTypeId_fkey" FOREIGN KEY ("productTypeId") REFERENCES "ProductType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
