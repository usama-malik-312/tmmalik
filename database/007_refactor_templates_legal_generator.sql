-- Align DB with Phase 2 legal generator: templates (name, content, fields), optional document case link.
-- Run after backup if you have production data.

BEGIN;

ALTER TABLE documents ALTER COLUMN "caseId" DROP NOT NULL;

-- Drop old FK if name differs; Prisma may use documents_caseId_fkey
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_caseId_fkey;

ALTER TABLE documents
  ADD CONSTRAINT documents_caseId_fkey
  FOREIGN KEY ("caseId") REFERENCES "Case"(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Templates: migrate title/body -> name/content, add fields JSONB
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'templates' AND column_name = 'title'
  ) THEN
    ALTER TABLE templates ADD COLUMN IF NOT EXISTS name VARCHAR(255);
    ALTER TABLE templates ADD COLUMN IF NOT EXISTS content TEXT;
    ALTER TABLE templates ADD COLUMN IF NOT EXISTS fields JSONB NOT NULL DEFAULT '[]'::jsonb;
    UPDATE templates SET
      name = COALESCE(NULLIF(TRIM(name), ''), title),
      content = COALESCE(NULLIF(TRIM(content), ''), body),
      fields = COALESCE(fields, '[]'::jsonb);
    ALTER TABLE templates DROP COLUMN title;
    ALTER TABLE templates DROP COLUMN body;
    ALTER TABLE templates DROP COLUMN IF EXISTS description;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'templates' AND column_name = 'fields'
  ) THEN
    ALTER TABLE templates ADD COLUMN IF NOT EXISTS fields JSONB NOT NULL DEFAULT '[]'::jsonb;
  END IF;
END $$;

COMMIT;
