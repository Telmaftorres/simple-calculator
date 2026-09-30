-- Temps machine impression calculé par le calculateur, stocké à l'enregistrement du devis
-- pour que la fiche de prod l'affiche sans saisie manuelle.
ALTER TABLE "Quote" ADD COLUMN "printingMachineTimeMin" DOUBLE PRECISION;
ALTER TABLE "QuoteAmalgameRun" ADD COLUMN "printingMachineTimeMin" DOUBLE PRECISION;
