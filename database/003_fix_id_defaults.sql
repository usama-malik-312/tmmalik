-- Fix missing auto-increment defaults for integer primary keys.
-- Run this if inserts fail with "Null constraint violation on fields: (id)".

BEGIN;

-- Ensure clients.id uses a sequence default
CREATE SEQUENCE IF NOT EXISTS clients_id_seq;
ALTER TABLE clients
  ALTER COLUMN id SET DEFAULT nextval('clients_id_seq');
ALTER SEQUENCE clients_id_seq OWNED BY clients.id;

SELECT setval(
  'clients_id_seq',
  COALESCE((SELECT MAX(id) FROM clients), 1),
  (SELECT EXISTS (SELECT 1 FROM clients))
);

-- Ensure cases.id uses a sequence default
CREATE SEQUENCE IF NOT EXISTS cases_id_seq;
ALTER TABLE cases
  ALTER COLUMN id SET DEFAULT nextval('cases_id_seq');
ALTER SEQUENCE cases_id_seq OWNED BY cases.id;

SELECT setval(
  'cases_id_seq',
  COALESCE((SELECT MAX(id) FROM cases), 1),
  (SELECT EXISTS (SELECT 1 FROM cases))
);

COMMIT;
