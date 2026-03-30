# Phase 3: Workflow & tracking system

## Summary

Phase 3 adds **case lifecycle tracking**, a global **Activity** feed, **who performed each action** (from the logged-in user), and **audit events** for clients, cases, templates, and documents.

## Database

### `CaseStatus` enum

Values: `draft`, `in_progress`, `submitted`, `completed`, `rejected`.

### `activities` table

| Column              | Type                 | Notes |
|---------------------|----------------------|-------|
| `id`                | UUID (text PK)       | Default `gen_random_uuid()` |
| `entityType`        | `ActivityEntityType` | `client`, `case`, `document`, `template` |
| `entityId`          | string               | Target entity id |
| `action`            | string               | See actions below |
| `metadata`          | JSON (nullable)      | Context (names, ids, etc.) |
| `actorUserId`       | int (nullable, FK) | `users.id` |
| `actorNameSnapshot` | text (nullable)      | Display name at time of action |
| `createdAt`         | timestamp            | |

**Actor resolution:** API reads `x-user-id` (set by the web app from the logged-in user), loads the user from the database, and stores `actorUserId` plus `actorNameSnapshot` (`fname` + `lname`). If the header is missing or invalid, the actor fields are null and the UI shows **Unknown user**.

### Migrations

- `prisma/migrations/20260330120000_phase3_workflow_activities/`
- `prisma/migrations/20260330140000_activity_actor_template_entity/` — `template` enum value, actor columns, FK to `users`

Startup **`ensureActivitiesSchema()`** also aligns legacy databases (enums, columns, table).

## Actions logged

| Area | Actions |
|------|---------|
| **Client** | `client_created`, `client_updated`, `client_deleted` |
| **Case** | `case_created`, `status_changed` |
| **Template** | `template_created`, `template_updated`, `template_deleted` (metadata includes `cascadeDeletedDocuments` when documents were removed with the template) |
| **Document** | `document_generated` (case-linked → `entityType: case`; standalone → `entityType: document`), `document_updated`, `document_deleted` |

Case timeline (`GET /cases/:id/activities`) lists rows with `entityType = case` and `entityId = case id` (including document events for that case).

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/activities` | Recent rows (`limit` query, default 50, max 100) |
| `GET` | `/cases/:id/activities` | Case timeline (oldest first) |

## Frontend

- **`/activity`** — Global feed: time, **By** (performer), description, entity, quick links.
- **`/cases/:id`** — Timeline: description + performer + timestamp.
- React Query invalidates `["activities", "recent"]` (and related case queries) after mutations so feeds stay current.

## How to test

1. Run migrations and `npx prisma generate`. Restart API if Prisma was locked.
2. Log in (so `x-user-id` is sent) — create/update clients, templates, cases, documents — confirm **By** shows your name on `/activity` and on case timelines.
3. Generate a document **without** a case — event appears on `/activity` with `document` entity.
4. Delete a template with linked documents — `template_deleted` shows cascade count in the description.
