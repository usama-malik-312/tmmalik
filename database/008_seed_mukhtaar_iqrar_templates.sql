-- Seed predefined legal templates (Mukhtaar Nama, Iqrar Nama) with structured fields JSON.
-- Requires columns: name, content, fields (jsonb).

BEGIN;

DELETE FROM documents
WHERE "templateId" IN (SELECT id FROM templates WHERE name IN ('Mukhtaar Nama', 'Iqrar Nama'));

DELETE FROM templates WHERE name IN ('Mukhtaar Nama', 'Iqrar Nama');

INSERT INTO templates (name, content, fields) VALUES (
  'Mukhtaar Nama',
  $muk$
GENERAL POWER OF ATTORNEY (MUKHTAAR NAMA)

This General Power of Attorney is executed on {{agreement_date}} at Karachi, Pakistan.

I, {{client_name}}, holder of CNIC No. {{cnic}}, residing at {{address}}, hereby appoint and authorize {{buyer_name}} to act on my behalf in all matters relating to the property described below, including execution of documents, receiving payments, and completing registration formalities, to the full extent permitted by law.

Property reference: {{property_reference}}

The counterparty in this transaction is identified as {{seller_name}}.

The total agreed consideration for this transaction is PKR {{total_amount}} (Pakistani Rupees).

I declare that the information stated above is true and correct to the best of my knowledge.

_________________________
{{client_name}}
Principal / Executant
$muk$,
  '[
    {"name":"client_name","label":"Full Legal Name","section":"client","input":"text"},
    {"name":"cnic","label":"CNIC Number","section":"client","input":"text"},
    {"name":"address","label":"Residential Address","section":"client","input":"textarea"},
    {"name":"buyer_name","label":"Authorized Attorney / Buyer Name","section":"transaction","input":"text"},
    {"name":"seller_name","label":"Counterparty Name (Seller)","section":"transaction","input":"text"},
    {"name":"property_reference","label":"Property Reference No.","section":"transaction","input":"text"},
    {"name":"total_amount","label":"Total Amount (PKR)","section":"transaction","input":"text"},
    {"name":"agreement_date","label":"Agreement Date","section":"transaction","input":"date"}
  ]'::jsonb
);

INSERT INTO templates (name, content, fields) VALUES (
  'Iqrar Nama',
  $iqr$
AFFIDAVIT / DECLARATION (IQRAR NAMA)

I, {{client_name}}, CNIC {{cnic}}, of {{address}}, do hereby solemnly affirm and declare as follows:

1. That I am the declarant above-named and competent to execute this affidavit.

2. That in connection with property reference {{property_reference}}, I acknowledge the arrangement between {{buyer_name}} and {{seller_name}}.

3. That the total consideration stated for this matter is PKR {{total_amount}}.

4. That this declaration is made on {{agreement_date}} in good faith and for the purposes of record.

Verified on {{agreement_date}} at Karachi.

_________________________
{{client_name}}
Deponent
$iqr$,
  '[
    {"name":"client_name","label":"Full Legal Name","section":"client","input":"text"},
    {"name":"cnic","label":"CNIC Number","section":"client","input":"text"},
    {"name":"address","label":"Residential Address","section":"client","input":"textarea"},
    {"name":"buyer_name","label":"Party Name (Buyer / First Party)","section":"transaction","input":"text"},
    {"name":"seller_name","label":"Party Name (Seller / Second Party)","section":"transaction","input":"text"},
    {"name":"property_reference","label":"Property Reference No.","section":"transaction","input":"text"},
    {"name":"total_amount","label":"Total Amount (PKR)","section":"transaction","input":"text"},
    {"name":"agreement_date","label":"Agreement Date","section":"transaction","input":"date"}
  ]'::jsonb
);

COMMIT;
