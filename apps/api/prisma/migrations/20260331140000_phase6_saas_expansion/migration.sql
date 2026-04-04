DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('admin', 'staff');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" "UserRole";
UPDATE "users" SET "role" = CASE WHEN "userType" = -1 THEN 'admin'::"UserRole" ELSE 'staff'::"UserRole" END WHERE "role" IS NULL;
ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'staff';

CREATE TABLE IF NOT EXISTS "Organization" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "UserOrganization" (
  "userId" INTEGER NOT NULL,
  "orgId" INTEGER NOT NULL,
  PRIMARY KEY ("userId", "orgId")
);

DO $$ BEGIN
  ALTER TABLE "UserOrganization"
  ADD CONSTRAINT "UserOrganization_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "UserOrganization"
  ADD CONSTRAINT "UserOrganization_orgId_fkey"
  FOREIGN KEY ("orgId") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
