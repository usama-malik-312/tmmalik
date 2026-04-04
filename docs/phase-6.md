# Phase 6: SaaS Expansion

## Implemented scope

Phase 6 converts the app toward multi-user SaaS operation with role-aware auth and organization membership.

## Database

Added:

- `UserRole` enum: `admin`, `staff`
- `users.role` with default `staff`
- `Organization` table:
  - `id`
  - `name`
  - `createdAt`
- `UserOrganization` table:
  - `userId`
  - `orgId`
  - composite primary key (`userId`, `orgId`)

Migration:
- `apps/api/prisma/migrations/20260331140000_phase6_saas_expansion/migration.sql`

## Backend

### JWT auth

Added dependency:
- `jsonwebtoken`

New auth flow:

- `POST /auth/register`
  - creates user
  - creates organization
  - creates user-organization membership
  - returns `{ token, user }`
- `POST /auth/login`
  - validates credentials
  - returns `{ token, user }`

Middleware:
- `requireAuth` parses `Authorization: Bearer <token>` and populates `req.auth`
- `requireRole` helper added for role checks

Role protection updates:
- `/users` routes now require auth + owner/admin style access (`ownerOnly` now accepts JWT admin role)

## Frontend

### Login/Register

`LoginPage` now has tabs:
- Login
- Register (name, organization, role, email, password)

On login/register:
- stores `auth_user`
- stores `auth_token`

### API authorization

`api.ts` now sends:
- `Authorization: Bearer <token>` when `auth_token` exists

### Role-based UI

- UI derives admin capability from `user.role`
- `/users` route and sidebar item shown only for admins

## Notes

- Existing `userType` support is preserved for backward compatibility.
- Passwords remain plain-text in this phase (legacy-compatible). Hashing can be added in a security hardening pass.
