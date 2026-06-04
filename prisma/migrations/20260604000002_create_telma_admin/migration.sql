-- Créer le compte admin pour la company Telma
INSERT INTO "User" ("id", "email", "password", "name", "firstName", "lastName", "role", "companyId", "mustChangePassword", "createdAt", "updatedAt")
VALUES (
  'cbb46f0e74e6f7ca7dca55c',
  'admin@telma.fr',
  '$2b$10$BiDtX/4TmwPFZ2R.S3RgBOyoAcmOUu0vuLF44I5D1P8gQiQSPVkbS',
  'Admin Telma',
  'Admin',
  'Telma',
  'ADMIN',
  (SELECT id FROM "Company" WHERE slug = 'telma'),
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("email") DO NOTHING;
