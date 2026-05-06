-- AlterTable
ALTER TABLE "ProductTemplate" ADD COLUMN     "hasAmalgame" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "hasAmalgame" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ProductTemplateAmalgameRun" (
    "id" SERIAL NOT NULL,
    "templateId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "plateId" INTEGER,
    "hasImpression" BOOLEAN NOT NULL DEFAULT true,
    "mainPerPlate" INTEGER,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductTemplateAmalgameRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductTemplateAmalgameRunItem" (
    "id" SERIAL NOT NULL,
    "runId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "flatWidth" INTEGER NOT NULL,
    "flatHeight" INTEGER NOT NULL,
    "countPerPlate" INTEGER NOT NULL,
    "quantityPerUnit" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ProductTemplateAmalgameRunItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteAmalgameRun" (
    "id" SERIAL NOT NULL,
    "quoteId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "plateId" INTEGER,
    "hasImpression" BOOLEAN NOT NULL DEFAULT true,
    "mainPerPlate" INTEGER,
    "platesCount" INTEGER,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuoteAmalgameRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteAmalgameRunItem" (
    "id" SERIAL NOT NULL,
    "runId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "flatWidth" INTEGER NOT NULL,
    "flatHeight" INTEGER NOT NULL,
    "countPerPlate" INTEGER NOT NULL,
    "quantityPerUnit" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "QuoteAmalgameRunItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProductTemplateAmalgameRun" ADD CONSTRAINT "ProductTemplateAmalgameRun_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ProductTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTemplateAmalgameRun" ADD CONSTRAINT "ProductTemplateAmalgameRun_plateId_fkey" FOREIGN KEY ("plateId") REFERENCES "Plate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTemplateAmalgameRunItem" ADD CONSTRAINT "ProductTemplateAmalgameRunItem_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ProductTemplateAmalgameRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteAmalgameRun" ADD CONSTRAINT "QuoteAmalgameRun_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteAmalgameRun" ADD CONSTRAINT "QuoteAmalgameRun_plateId_fkey" FOREIGN KEY ("plateId") REFERENCES "Plate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteAmalgameRunItem" ADD CONSTRAINT "QuoteAmalgameRunItem_runId_fkey" FOREIGN KEY ("runId") REFERENCES "QuoteAmalgameRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
