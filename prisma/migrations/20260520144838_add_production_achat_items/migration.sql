-- CreateTable
CREATE TABLE "ProductionAchatItem" (
    "id" SERIAL NOT NULL,
    "productionSheetId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "reference" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductionAchatItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProductionAchatItem" ADD CONSTRAINT "ProductionAchatItem_productionSheetId_fkey" FOREIGN KEY ("productionSheetId") REFERENCES "ProductionSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
