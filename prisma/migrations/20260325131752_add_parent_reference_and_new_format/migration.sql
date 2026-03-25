ALTER TABLE "Quote" ADD COLUMN "parentReference" TEXT;

UPDATE "Quote"
SET reference = 
  'C' || 
  LPAD(SUBSTRING(reference FROM 2 FOR 4)::integer::text, 3, '0') ||
  '-' ||
  SUBSTRING(reference FROM 7 FOR 2) ||
  SUBSTRING(reference FROM 11 FOR 2)
WHERE reference IS NOT NULL
  AND reference ~ '^C\d{4}-\d{6}$';