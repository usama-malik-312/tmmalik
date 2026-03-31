CREATE TABLE IF NOT EXISTS "archives" (
  "id" SERIAL PRIMARY KEY,
  "clientId" INTEGER,
  "title" TEXT NOT NULL,
  "documentType" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "archives_clientId_idx" ON "archives"("clientId");
CREATE INDEX IF NOT EXISTS "archives_documentType_idx" ON "archives"("documentType");

DO $$
BEGIN
  ALTER TABLE "archives"
  ADD CONSTRAINT "archives_clientId_fkey"
  FOREIGN KEY ("clientId")
  REFERENCES "Client"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
