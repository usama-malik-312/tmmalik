-- Phase 2 schema extension: templates and generated documents

BEGIN;

CREATE TABLE IF NOT EXISTS templates (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  description TEXT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  "templateId" INTEGER NOT NULL REFERENCES templates(id) ON DELETE RESTRICT,
  "caseId" INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  "generatedContent" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_template_id ON documents("templateId");
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON documents("caseId");

COMMIT;
