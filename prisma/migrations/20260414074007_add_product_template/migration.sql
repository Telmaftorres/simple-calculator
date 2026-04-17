-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "templateId" INTEGER;

-- CreateTable
CREATE TABLE "ProductTemplate" (
    "id" SERIAL NOT NULL,
    "productTypeId" INTEGER,
    "name" TEXT NOT NULL,
    "flatWidth" INTEGER,
    "flatHeight" INTEGER,
    "plateId" INTEGER,
    "hasImpression" BOOLEAN NOT NULL DEFAULT true,
    "printMode" TEXT NOT NULL DEFAULT 'production',
    "printSetupType" TEXT NOT NULL DEFAULT 'none',
    "isRectoVerso" BOOLEAN NOT NULL DEFAULT false,
    "rectoVersoType" TEXT,
    "hasVarnish" BOOLEAN NOT NULL DEFAULT false,
    "hasFlatColor" BOOLEAN NOT NULL DEFAULT false,
    "cuttingTimePerPoseSeconds" INTEGER NOT NULL DEFAULT 0,
    "cuttingSetupType" TEXT NOT NULL DEFAULT 'none',
    "hasFaconnage" BOOLEAN NOT NULL DEFAULT true,
    "assemblyTimePerPieceSeconds" INTEGER NOT NULL DEFAULT 0,
    "hasConditionnement" BOOLEAN NOT NULL DEFAULT true,
    "packTimePerPieceSeconds" INTEGER NOT NULL DEFAULT 0,
    "hasAssemblyNotice" BOOLEAN NOT NULL DEFAULT false,
    "hasAccessoires" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductTemplate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProductTemplate" ADD CONSTRAINT "ProductTemplate_productTypeId_fkey" FOREIGN KEY ("productTypeId") REFERENCES "ProductType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTemplate" ADD CONSTRAINT "ProductTemplate_plateId_fkey" FOREIGN KEY ("plateId") REFERENCES "Plate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ProductTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
