-- Créer la company Telma
INSERT INTO "Company" ("name", "slug", "createdAt", "updatedAt")
VALUES ('Telma', 'telma', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Assigner l'utilisateur telma.ferreiratorres@icloud.com à la company Telma
UPDATE "User"
SET "companyId" = (SELECT id FROM "Company" WHERE slug = 'telma')
WHERE email = 'telma.ferreiratorres@icloud.com';
