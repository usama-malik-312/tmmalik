import { prisma } from "../config/prisma.js";

/**
 * Ensures Phase 3+ `activities` table + enums exist so tracking works
 * even when `prisma migrate deploy` was not run locally.
 */
export async function ensureActivitiesSchema(): Promise<void> {
  try {
    await ensureCaseStatusValues();
    await ensureActivityEntityTypeEnum();
    await ensureActivityEntityTypeTemplateValue();
    await ensureActivitiesTable();
    await ensureActivityActorColumns();
  } catch (err) {
    console.error("[DB] ensureActivitiesSchema failed:", err);
  }
}

async function ensureActivityEntityTypeEnum(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "ActivityEntityType" AS ENUM ('client', 'case', 'document');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);
}

async function ensureActivityEntityTypeTemplateValue(): Promise<void> {
  // ALTER TYPE ... ADD VALUE inside DO/transaction can fail on some PG setups.
  // Run direct statement with IF NOT EXISTS for safe idempotency.
  await prisma.$executeRawUnsafe(`ALTER TYPE "ActivityEntityType" ADD VALUE IF NOT EXISTS 'template'`);
}

async function ensureActivitiesTable(): Promise<void> {
  const rows = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT COUNT(*)::bigint AS n
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'activities'
  `;
  const exists = Number(rows[0]?.n ?? 0) > 0;
  if (exists) {
    return;
  }

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "activities" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "entityType" "ActivityEntityType" NOT NULL,
      "entityId" TEXT NOT NULL,
      "action" TEXT NOT NULL,
      "metadata" JSONB,
      "actorUserId" INTEGER,
      "actorNameSnapshot" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "activities_entityType_entityId_idx"
    ON "activities"("entityType", "entityId");
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "activities" ADD CONSTRAINT "activities_actorUserId_fkey"
      FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "activities_actorUserId_idx" ON "activities"("actorUserId");
  `);

  console.log("[DB] Created activities table (Phase 3 workflow).");
}

async function ensureActivityActorColumns(): Promise<void> {
  const rows = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT COUNT(*)::bigint AS n
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'activities'
  `;
  if (Number(rows[0]?.n ?? 0) === 0) {
    return;
  }

  await prisma.$executeRawUnsafe(`ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "actorUserId" INTEGER`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "actorNameSnapshot" TEXT`);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "activities" ADD CONSTRAINT "activities_actorUserId_fkey"
      FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "activities_actorUserId_idx" ON "activities"("actorUserId");
  `);
}

async function ensureCaseStatusValues(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        WHERE e.enumtypid = 'CaseStatus'::regtype AND e.enumlabel = 'submitted'
      ) THEN
        ALTER TYPE "CaseStatus" ADD VALUE 'submitted';
      END IF;
    EXCEPTION
      WHEN undefined_object THEN NULL;
    END $$;
  `);
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        WHERE e.enumtypid = 'CaseStatus'::regtype AND e.enumlabel = 'rejected'
      ) THEN
        ALTER TYPE "CaseStatus" ADD VALUE 'rejected';
      END IF;
    EXCEPTION
      WHEN undefined_object THEN NULL;
    END $$;
  `);
}
