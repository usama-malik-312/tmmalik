-- Fix: Prisma expects templates.name, templates.content, templates.fields
-- Your DB may still have legacy columns title, body, description.
-- Safe to run multiple times.

BEGIN;

ALTER TABLE templates ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE templates ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS fields JSONB DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'templates' AND column_name = 'title'
  ) THEN
    UPDATE templates SET
      name = COALESCE(NULLIF(TRIM(name), ''), NULLIF(TRIM(title), ''), 'Untitled'),
      content = COALESCE(NULLIF(TRIM(content), ''), NULLIF(TRIM(body), ''), ''),
      fields = COALESCE(fields, '[]'::jsonb);
    ALTER TABLE templates DROP COLUMN title;
    ALTER TABLE templates DROP COLUMN body;
    ALTER TABLE templates DROP COLUMN IF EXISTS description;
  END IF;
END $$;

UPDATE templates SET fields = COALESCE(fields, '[]'::jsonb) WHERE fields IS NULL;
UPDATE templates SET name = COALESCE(NULLIF(TRIM(name), ''), 'Untitled') WHERE name IS NULL;
UPDATE templates SET content = COALESCE(content, '') WHERE content IS NULL;

ALTER TABLE templates ALTER COLUMN name SET NOT NULL;
ALTER TABLE templates ALTER COLUMN content SET NOT NULL;
ALTER TABLE templates ALTER COLUMN fields SET NOT NULL;
ALTER TABLE templates ALTER COLUMN fields SET DEFAULT '[]'::jsonb;

COMMIT;
