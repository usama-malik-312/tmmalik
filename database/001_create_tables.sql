CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  cnic VARCHAR(50) UNIQUE NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  notes TEXT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'case_status') THEN
    CREATE TYPE case_status AS ENUM ('draft', 'in_progress', 'completed');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS cases (
  id SERIAL PRIMARY KEY,
  "clientId" INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  "caseType" VARCHAR(255) NOT NULL,
  status case_status NOT NULL DEFAULT 'draft',
  "propertyDetails" TEXT NOT NULL,
  notes TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cases_client_id ON cases("clientId");
