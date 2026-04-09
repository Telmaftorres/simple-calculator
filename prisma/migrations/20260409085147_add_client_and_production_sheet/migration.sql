-- CreateTable
CREATE TABLE "ProductionSheet" (
    "id" SERIAL NOT NULL,
    "quoteId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "nbCollages" INTEGER,
    "collagePerPLV" DOUBLE PRECISION,
    "faconnageNotes" TEXT,
    "conditionnementType" TEXT,
    "conditionnementNotes" TEXT,
    "achatsNotes" TEXT,
    "remarques" TEXT,
    "status" TEXT NOT NULL DEFAULT 'en_attente',

    CONSTRAINT "ProductionSheet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductionSheet_quoteId_key" ON "ProductionSheet"("quoteId");

-- AddForeignKey
ALTER TABLE "ProductionSheet" ADD CONSTRAINT "ProductionSheet_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
