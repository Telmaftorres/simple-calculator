-- CreateTable
CREATE TABLE "QuoteActuals" (
    "id" SERIAL NOT NULL,
    "quoteId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "actualCuttingTimePerPoseSeconds" DOUBLE PRECISION,
    "actualAssemblyTimePerPieceSeconds" DOUBLE PRECISION,
    "actualPackTimePerPieceSeconds" DOUBLE PRECISION,
    "actualCuttingTotalMinutes" DOUBLE PRECISION,
    "actualAssemblyTotalMinutes" DOUBLE PRECISION,
    "actualPackTotalMinutes" DOUBLE PRECISION,
    "actualPrintTotalMinutes" DOUBLE PRECISION,
    "actualPlatesUsed" INTEGER,
    "actualWastePercent" DOUBLE PRECISION,
    "actualTransportMode" TEXT,
    "actualTransportCost" DOUBLE PRECISION,
    "actualWeightKg" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "QuoteActuals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuoteActuals_quoteId_key" ON "QuoteActuals"("quoteId");

-- AddForeignKey
ALTER TABLE "QuoteActuals" ADD CONSTRAINT "QuoteActuals_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
