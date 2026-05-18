-- CreateTable
CREATE TABLE "ProductionAmalgameRun" (
    "id" SERIAL NOT NULL,
    "productionSheetId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "ProductionAmalgameRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionAmalgameItem" (
    "id" SERIAL NOT NULL,
    "runId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "flatWidth" INTEGER NOT NULL,
    "flatHeight" INTEGER NOT NULL,
    "flatDepth" INTEGER,
    "countPerPlate" INTEGER NOT NULL DEFAULT 1,
    "quantityPerUnit" INTEGER NOT NULL DEFAULT 1,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductionAmalgameItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProductionAmalgameRun" ADD CONSTRAINT "ProductionAmalgameRun_productionSheetId_fkey" FOREIGN KEY ("productionSheetId") REFERENCES "ProductionSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionAmalgameItem" ADD CONSTRAINT "ProductionAmalgameItem_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ProductionAmalgameRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
