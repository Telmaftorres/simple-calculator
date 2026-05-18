-- CreateTable
CREATE TABLE "ProductionProductLine" (
    "id" SERIAL NOT NULL,
    "productionSheetId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductionProductLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionProductLineElement" (
    "id" SERIAL NOT NULL,
    "lineId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "flatWidth" INTEGER NOT NULL,
    "flatHeight" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductionProductLineElement_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProductionProductLine" ADD CONSTRAINT "ProductionProductLine_productionSheetId_fkey" FOREIGN KEY ("productionSheetId") REFERENCES "ProductionSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionProductLineElement" ADD CONSTRAINT "ProductionProductLineElement_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "ProductionProductLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
