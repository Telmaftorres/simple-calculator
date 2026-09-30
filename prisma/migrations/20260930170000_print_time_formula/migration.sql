-- Nouvelle formule temps machine impression (formule atelier)
ALTER TABLE "Quote" ADD COLUMN "varnishType" TEXT;
ALTER TABLE "Quote" ADD COLUMN "platesPerTray" INTEGER NOT NULL DEFAULT 1;

INSERT INTO "Setting" (key, value, label, unit, "companyId", "updatedAt")
SELECT v.key, v.value, v.label, v.unit, c.id, NOW()
FROM "Company" c
CROSS JOIN (VALUES
  ('PRINT_FIXED_TIME_SEC','11.6','Temps fixe machine (par plateau)','s'),
  ('PRINT_X_SEC_PER_MM','0.01107','Vitesse déplacement X','s/mm'),
  ('PRINT_Y_SEC_PER_MM','0.08266','Vitesse déplacement Y (passes)','s/mm'),
  ('PRINT_TRAY_GAP_MM','50','Écart entre plaques sur le plateau','mm'),
  ('PRINT_MODE_COEF_PRODUCTION','1','Coeff mode Production','x'),
  ('PRINT_MODE_COEF_QUALITY','2','Coeff mode Qualité','x'),
  ('PRINT_COEF_WHITE','2.4','Coeff blanc de soutien (à 100 %)','x'),
  ('PRINT_COEF_VARNISH_GLOSS','1.8','Coeff vernis gloss (à 100 %)','x'),
  ('PRINT_COEF_VARNISH_SEMI_GLOSS','1.75','Coeff vernis semi gloss (à 100 %)','x'),
  ('PRINT_COEF_VARNISH_MATTE','2.2','Coeff vernis matte (à 100 %)','x')
) AS v(key, value, label, unit)
WHERE NOT EXISTS (SELECT 1 FROM "Setting" s WHERE s.key = v.key AND s."companyId" = c.id);
