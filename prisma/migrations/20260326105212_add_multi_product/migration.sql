-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "isMultiProduct" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "QuoteProduct" (
    "id" SERIAL NOT NULL,
    "quoteId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "productTypeId" INTEGER,
    "productTypeName" TEXT,
    "flatWidth" INTEGER NOT NULL DEFAULT 0,
    "flatHeight" INTEGER NOT NULL DEFAULT 0,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "plateId" INTEGER,
    "itemsPerPlate" INTEGER,
    "platesCount" INTEGER,
    "printMode" TEXT NOT NULL DEFAULT 'production',
    "isRectoVerso" BOOLEAN NOT NULL DEFAULT false,
    "rectoVersoType" TEXT,
    "inkMlPerPlate" INTEGER NOT NULL DEFAULT 0,
    "varnishSurfacePercent" INTEGER NOT NULL DEFAULT 0,
    "flatColorSurfacePercent" INTEGER NOT NULL DEFAULT 0,
    "hasVarnish" BOOLEAN NOT NULL DEFAULT false,
    "hasFlatColor" BOOLEAN NOT NULL DEFAULT false,
    "hasImpression" BOOLEAN NOT NULL DEFAULT true,
    "hasPrintSetup" BOOLEAN NOT NULL DEFAULT true,
    "cuttingTimePerPoseSeconds" INTEGER NOT NULL DEFAULT 0,
    "hasCuttingSetup" BOOLEAN NOT NULL DEFAULT true,
    "totalCost" DOUBLE PRECISION,

    CONSTRAINT "QuoteProduct_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "QuoteProduct" ADD CONSTRAINT "QuoteProduct_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteProduct" ADD CONSTRAINT "QuoteProduct_plateId_fkey" FOREIGN KEY ("plateId") REFERENCES "Plate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
