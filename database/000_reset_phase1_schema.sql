-- WARNING: This resets Phase 1 tables and deletes existing clients/cases data.
-- Use only in local development.

BEGIN;

DROP TABLE IF EXISTS cases CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TYPE IF EXISTS case_status CASCADE;

CREATE TYPE case_status AS ENUM ('draft', 'in_progress', 'completed');

CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  cnic VARCHAR(50) UNIQUE NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  notes TEXT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE cases (
  id SERIAL PRIMARY KEY,
  "clientId" INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  "caseType" VARCHAR(255) NOT NULL,
  status case_status NOT NULL DEFAULT 'draft',
  "propertyDetails" TEXT NOT NULL,
  notes TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cases_client_id ON cases("clientId");

COMMIT;
