# Phase 5: Legacy Vault (Archive System)

## Implemented scope

Phase 5 adds digitized archive storage with upload + search:

- New `archives` table
- API to upload scanned documents
- API to search archives by CNIC / Name / Document type
- New frontend `Archive / Vault` page

## Database

### New table: `archives`

Columns:
- `id` (auto increment)
- `clientId` (nullable FK to `Client`)
- `title`
- `documentType`
- `fileUrl`
- `metadata` (JSON, nullable)
- `createdAt`

Migration:
- `apps/api/prisma/migrations/20260331120000_phase5_archive_vault/migration.sql`

## Backend

### Upload API

- `POST /archives/upload`
- Multipart form-data (`file` required)
- Other fields:
  - `title` (required)
  - `documentType` (required)
  - `clientId` (optional)
  - `cnic` (optional metadata)
  - `name` (optional metadata)
- Stores uploaded files under `uploads/archives/`
- Returns created archive record

### Search API

- `GET /archives`
- Query params:
  - `cnic`
  - `name`
  - `documentType`
  - pagination via existing list query (`page`, `pageSize`)
- Includes linked client details if available

### Static files

- `app.use("/uploads", express.static("uploads"))`
- `fileUrl` is returned as absolute URL in API list response

## Frontend

### New page: `Archive / Vault`

Route:
- `/archives`

Features:
- Upload scanned document with metadata
- Optional client linkage
- Search by:
  - CNIC
  - Name
  - Document type
- Table view with:
  - Title
  - Type
  - Client
  - Date
  - Download button

## Notes

- This implementation uses local disk storage for uploaded files for now.
- Archive records remain searchable even without linked `clientId` when metadata contains `cnic`/`name`.
