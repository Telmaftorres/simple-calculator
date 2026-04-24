-- Extend ProductionSheet with production planning override fields
ALTER TABLE "ProductionSheet" ADD COLUMN "prodCuttingTimePerPoseSeconds"   DOUBLE PRECISION;
ALTER TABLE "ProductionSheet" ADD COLUMN "prodAssemblyTimePerPieceSeconds" DOUBLE PRECISION;
ALTER TABLE "ProductionSheet" ADD COLUMN "prodPackTimePerPieceSeconds"     DOUBLE PRECISION;
ALTER TABLE "ProductionSheet" ADD COLUMN "prodInkMlPerPlate"               DOUBLE PRECISION;
ALTER TABLE "ProductionSheet" ADD COLUMN "prodPlatesCount"                 INTEGER;
ALTER TABLE "ProductionSheet" ADD COLUMN "prodTransportCost"               DOUBLE PRECISION;
ALTER TABLE "ProductionSheet" ADD COLUMN "prodTransportNotes"              TEXT;
