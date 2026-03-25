INSERT INTO templates (title, description, body)
VALUES
  (
    'Property Transfer Application',
    'General property transfer request document',
    'To whom it may concern,\n\nI, {{client.name}} (CNIC: {{client.cnic}}), request processing of my {{case.type}}.\nProperty details: {{case.propertyDetails}}\nContact: {{client.phone}}\n\nSincerely,\n{{client.name}}'
  ),
  (
    'Legal Notice Draft',
    'Initial legal notice draft template',
    'Legal Notice\n\nClient: {{client.name}}\nAddress: {{client.address}}\nCase Ref: {{case.id}}\nStatus: {{case.status}}\n\nNotes:\n{{case.notes}}\n\nPrepared by: {{office.name}}'
  )
ON CONFLICT DO NOTHING;
