ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "language" TEXT DEFAULT 'ur';

UPDATE "templates"
SET "language" = 'ur'
WHERE "language" IS NULL;

ALTER TABLE "templates" ALTER COLUMN "language" SET NOT NULL;
ALTER TABLE "templates" ALTER COLUMN "language" SET DEFAULT 'ur';
