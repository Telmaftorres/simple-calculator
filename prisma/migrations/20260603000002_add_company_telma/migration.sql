-- Créer la company Telma
INSERT INTO "Company" ("name", "slug", "createdAt", "updatedAt")
VALUES ('Telma', 'telma', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Assigner l'utilisateur telma.ferreiratorres@icloud.com à la company Telma
UPDATE "User"
SET "companyId" = (SELECT id FROM "Company" WHERE slug = 'telma')
WHERE email = 'telma.ferreiratorres@icloud.com';

-- Pré-remplir la clé API sortante CRM pour Telma
INSERT INTO "Setting" ("key", "value", "label", "createdAt", "updatedAt")
VALUES ('CRM_OUTBOUND_KEY', 'sk_kontfeel_a8f3k2p9x7m1q4w6n5j8v2r0t3y6u1', 'Clé API CRM sortante', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
