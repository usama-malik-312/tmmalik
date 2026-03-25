INSERT INTO clients (name, cnic, phone, address, notes)
VALUES
  ('Ali Raza', '35202-1234567-1', '0300-1111111', 'Johar Town, Lahore', 'First consultation done'),
  ('Sara Khan', '35202-7654321-2', '0301-2222222', 'DHA Phase 5, Lahore', 'Needs urgent transfer case'),
  ('Usman Tariq', '61101-9876543-3', '0302-3333333', 'F-10, Islamabad', NULL)
ON CONFLICT (cnic) DO NOTHING;

INSERT INTO cases ("clientId", "caseType", status, "propertyDetails", notes)
VALUES
  (1, 'Property Transfer', 'in_progress', '5 Marla residential plot transfer', 'Documents submitted'),
  (2, 'Sale Deed Drafting', 'draft', 'Commercial office unit sale deed', 'Waiting for buyer details'),
  (3, 'Title Verification', 'completed', 'Verification of inherited land', 'Verification completed')
ON CONFLICT DO NOTHING;
