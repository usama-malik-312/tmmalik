ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "qrCode" TEXT;
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "verificationId" TEXT;

UPDATE "documents"
SET "verificationId" = 'legacy-' || "id"::text || '-' || SUBSTRING(md5(random()::text || clock_timestamp()::text), 1, 12)
WHERE "verificationId" IS NULL;

ALTER TABLE "documents" ALTER COLUMN "verificationId" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "documents_verificationId_key" ON "documents"("verificationId");
