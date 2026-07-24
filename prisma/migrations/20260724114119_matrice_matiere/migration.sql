-- Matrice matière (CDC V1.0) : 12 coeffs prix/m² × quantité, ajoutés aux entreprises existantes (sans écraser si déjà présents)
INSERT INTO "Setting" (key, value, label, unit, "companyId", "updatedAt")
SELECT v.key, v.value, v.label, 'x', c.id, NOW()
FROM "Company" c
CROSS JOIN (VALUES
  ('MATERIAL_MARGIN_Q1_P1','3.5','Coeff matière · 1-5 ex · ≤8 €/m²'),
  ('MATERIAL_MARGIN_Q1_P2','2.8','Coeff matière · 1-5 ex · 8-20 €/m²'),
  ('MATERIAL_MARGIN_Q1_P3','2.2','Coeff matière · 1-5 ex · >20 €/m²'),
  ('MATERIAL_MARGIN_Q2_P1','3.0','Coeff matière · 6-50 ex · ≤8 €/m²'),
  ('MATERIAL_MARGIN_Q2_P2','2.5','Coeff matière · 6-50 ex · 8-20 €/m²'),
  ('MATERIAL_MARGIN_Q2_P3','2.0','Coeff matière · 6-50 ex · >20 €/m²'),
  ('MATERIAL_MARGIN_Q3_P1','2.6','Coeff matière · 51-200 ex · ≤8 €/m²'),
  ('MATERIAL_MARGIN_Q3_P2','2.2','Coeff matière · 51-200 ex · 8-20 €/m²'),
  ('MATERIAL_MARGIN_Q3_P3','1.8','Coeff matière · 51-200 ex · >20 €/m²'),
  ('MATERIAL_MARGIN_Q4_P1','2.2','Coeff matière · >201 ex · ≤8 €/m²'),
  ('MATERIAL_MARGIN_Q4_P2','1.8','Coeff matière · >201 ex · 8-20 €/m²'),
  ('MATERIAL_MARGIN_Q4_P3','1.5','Coeff matière · >201 ex · >20 €/m²')
) AS v(key, value, label)
WHERE NOT EXISTS (SELECT 1 FROM "Setting" s WHERE s.key = v.key AND s."companyId" = c.id);
