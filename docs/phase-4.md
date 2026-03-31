# Phase 4: Automation Layer

## Scope Implemented

This phase adds:
- Fee calculator (backend utility + frontend UI)
- QR code generation for documents
- Verification endpoint by verification ID
- WhatsApp notification placeholder endpoint

## Database

`documents` now includes:
- `qrCode` (text, nullable)
- `verificationId` (text, unique, non-null)

Migration:
- `apps/api/prisma/migrations/20260330160000_phase4_automation_document_verify_fields/migration.sql`

## Backend

### Fee calculator

Utility:
- `apps/api/src/utils/feeCalculator.ts`
- `calculateFees(amount, type)` returns:
  - `stampDuty`
  - `cvt`
  - `total`

API:
- `POST /automation/fees/calculate`
  - body: `{ amount, type }`
  - response: `{ amount, type, stampDuty, cvt, total }`

### QR + Verification

On document generation:
- A UUID `verificationId` is created
- Verification URL is built (`VERIFY_BASE_URL` fallback `http://localhost:5000`)
- QR image is generated using `qrcode` library and saved in `documents.qrCode`

Verification API:
- `GET /verify/:id`
  - `:id` is `verificationId`
  - returns core document verification details

### WhatsApp placeholder

API:
- `POST /automation/whatsapp/mock`
  - body: `{ phone, message }`
  - returns mock-sent payload

## Frontend

Updated `Documents` page:
- New **Fee Calculator** tab
  - amount + type input
  - shows stamp duty / CVT / total
- Added **Share Demo** card in the same tab (frontend guidance for demo sharing)
- Added frontend-only demo sharing dropdowns (no paid gateway):
  - **Cases list**: `Send via WhatsApp` + `Copy Link`
  - **Generated documents list**: `Send via WhatsApp` + `Copy Link`
  - WhatsApp opens `wa.me` with prefilled text, so it uses logged-in WhatsApp Web session
- Generated documents table now shows:
  - verification ID
  - **Verify document** action
- Document view modal now shows:
  - QR code image (if present)
  - verification ID
  - verify button

## Test Checklist

1. Generate a document from `Documents` page.
2. Confirm generated row has `verificationId`.
3. Open view modal:
   - QR image should display
   - Verify button should open `/verify/:verificationId`.
4. Use Fee Calculator tab and verify breakdown appears.
5. Optional: call `POST /automation/whatsapp/mock` and confirm mock response.
