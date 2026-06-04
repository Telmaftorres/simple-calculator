-- Configurer le CRM pour la company Telma
DO $$
DECLARE telma_id INTEGER;
BEGIN
  SELECT id INTO telma_id FROM "Company" WHERE slug = 'telma';

  -- URL de base du CRM (sans slash final)
  INSERT INTO "Setting" ("key", "value", "label", "companyId", "createdAt", "updatedAt")
  VALUES ('CRM_API_URL', 'https://kontfeel-crm.com/api/calculateur', 'URL API CRM', telma_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT ("key", "companyId") DO UPDATE SET value = EXCLUDED.value;

  -- Clé API sortante pour appeler le CRM
  INSERT INTO "Setting" ("key", "value", "label", "companyId", "createdAt", "updatedAt")
  VALUES ('CRM_OUTBOUND_KEY', 'sk_kontfeel_a8f3k2p9x7m1q4w6n5j8v2r0t3y6u1', 'Clé API CRM sortante', telma_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT ("key", "companyId") DO UPDATE SET value = EXCLUDED.value;
END $$;
