-- Fiche de production : la matière et le temps de découpe d'un run d'amalgame n'avaient
-- nulle part où être enregistrés une fois que la fiche de prod a ses propres runs.
ALTER TABLE "ProductionAmalgameRun" ADD COLUMN "plateId" INTEGER;
ALTER TABLE "ProductionAmalgameRun" ADD COLUMN "cuttingTimePerPoseSeconds" INTEGER;
ALTER TABLE "ProductionAmalgameRun" ADD CONSTRAINT "ProductionAmalgameRun_plateId_fkey"
  FOREIGN KEY ("plateId") REFERENCES "Plate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
