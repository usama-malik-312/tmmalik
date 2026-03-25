# Phase 1 - Foundation (Clients + Cases)

## What was built
- Monorepo with `apps/api`, `apps/web`, and `packages/types`.
- Express + TypeScript + Prisma backend with client/case APIs.
- React + Ant Design frontend with Dashboard, Clients, and Cases pages.
- Input validation and API error middleware.

## DB schema
### clients
- id (uuid, pk)
- name (string)
- cnic (string, unique)
- phone (string)
- address (text)
- notes (text, optional)
- createdAt (timestamp)

### cases
- id (uuid, pk)
- clientId (fk -> clients.id)
- caseType (string)
- status (enum: draft, in_progress, completed)
- propertyDetails (text)
- notes (text)
- createdAt (timestamp)

## API list
### Clients
- POST `/clients`
- GET `/clients`
- GET `/clients/:id`
- PUT `/clients/:id`
- DELETE `/clients/:id`

### Cases
- POST `/cases`
- GET `/cases`
- GET `/cases/:id`
- PUT `/cases/:id`

## How to run project
1. Copy `apps/api/.env.example` to `apps/api/.env`.
2. Set `DATABASE_URL` for your PostgreSQL DB.
3. Run:
   - `npm run prisma:generate -w api`
   - `npm run prisma:migrate -w api -- --name init`
4. Start backend: `npm run dev:api`
5. Start frontend: `npm run dev:web`
6. Open `http://localhost:5173`
