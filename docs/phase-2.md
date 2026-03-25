# Phase 2 - Document Generator (Legal UX)

## What was built
- **Templates** store legal copy (`content`) plus a **`fields` JSON array** that drives the UI (labels, sections, input types).
- **Structured generation**: `POST /documents/generate` accepts `formData` (object shaped by the template). No key=value or raw JSON entry in the UI.
- **Document Generator page**: split layout — structured form on the left, **live preview** on the right (serif “paper”, placeholders fill in real time, bold for filled values).
- **Predefined templates**: Mukhtaar Nama & Iqrar Nama are seeded via SQL (`database/008_seed_mukhtaar_iqrar_templates.sql`).
- **Optional case link** when saving a generated document (`caseId` nullable).

## Database schema

### `templates`
- `id` (serial, pk)
- `name` (string) — e.g. “Mukhtaar Nama”
- `content` (text) — body with `{{placeholder_name}}` tokens
- `fields` (jsonb) — array of `{ "name", "label", "section"?, "input"? }`
- `createdAt` (timestamp)

### `documents`
- `id` (serial, pk)
- `templateId` (fk → `templates.id`)
- `caseId` (fk → `Case.id`, **nullable**)
- `generatedContent` (text)
- `createdAt` (timestamp)

## API

### Templates
- `POST /templates` — body: `{ name, content, fields: [ { name, label, section?, input? } ] }`
- `GET /templates`
- `GET /templates/:id`
- `PUT /templates/:id`
- `DELETE /templates/:id`

### Documents
- `POST /documents/generate` — body:
  ```json
  {
    "templateId": 1,
    "caseId": null,
    "formData": {
      "client_name": "Zeeshan Ali Khan",
      "cnic": "42101-9876543-1",
      "address": "H-24, Street 9, DHA Phase 6, Karachi",
      "buyer_name": "Maryam Farooq",
      "seller_name": "…",
      "property_reference": "KDA-7721-B",
      "total_amount": "12,500,000",
      "agreement_date": "11/24/2023"
    }
  }
  ```
- `GET /documents`
- `GET /documents/:id`

Placeholders in `content` must match **`formData` keys** (e.g. `{{client_name}}`, `{{agreement_date}}`).

## Migrate / seed (PostgreSQL)

0. **If API errors say `templates.name` does not exist** (DB still has `title` / `body`):
   - `"/c/Program Files/PostgreSQL/17/bin/psql.exe" -U postgres -d tmmalik -f database/009_sync_templates_name_content.sql`

1. Refactor templates + nullable `caseId` (if upgrading from older Phase 2):
   - `"/c/Program Files/PostgreSQL/17/bin/psql.exe" -U postgres -d tmmalik -f database/007_refactor_templates_legal_generator.sql`
2. Seed Mukhtaar / Iqrar templates:
   - `"/c/Program Files/PostgreSQL/17/bin/psql.exe" -U postgres -d tmmalik -f database/008_seed_mukhtaar_iqrar_templates.sql`

Or from repo root after schema change:

```bash
npm run prisma:generate -w api
cd apps/api && npx prisma db push
```

3. Run API and web:
   - `npm run dev:api`
   - `npm run dev:web`

Open **Documents → Document Generator**.

## UI behaviour
- Template cards load from `GET /templates` (seeded names appear as **Mukhtaar Nama** / **Iqrar Nama**).
- **Select existing client** fills client fields when those `fields` exist on the template.
- **Transaction** fields are driven by `fields` with `section: "transaction"`.
- **Print** / **Download PDF** use the browser print dialog (choose “Save as PDF” where supported).
