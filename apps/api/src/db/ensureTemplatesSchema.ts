import { prisma } from "../config/prisma.js";

/**
 * Self-heal legacy DBs where `templates` still has title/body or is missing name/content/fields.
 * Runs once at API startup so POST /templates works without manual SQL.
 */
export async function ensureTemplatesSchema(): Promise<void> {
  let tableExists = false;
  try {
    const rows = await prisma.$queryRaw<{ n: bigint }[]>`
      SELECT COUNT(*)::bigint AS n
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'templates'
    `;
    tableExists = Number(rows[0]?.n ?? 0) > 0;
  } catch {
    return;
  }

  if (!tableExists) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "templates" (
        "id" SERIAL NOT NULL,
        "name" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "language" TEXT DEFAULT 'en',
        "fields" JSONB NOT NULL DEFAULT '[]',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log("[DB] Created table templates (name, content, fields).");
    return;
  }

  await prisma.$executeRawUnsafe(`ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "name" TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "content" TEXT`);
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "fields" JSONB DEFAULT '[]'::jsonb`
  );
  await prisma.$executeRawUnsafe(`ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "language" TEXT DEFAULT 'en'`);
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "templates" ALTER COLUMN "language" SET DEFAULT 'en'`
  );

  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'templates' AND column_name = 'title'
      ) THEN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'templates' AND column_name = 'body'
        ) THEN
          UPDATE "templates" SET
            "name" = COALESCE(NULLIF(TRIM("name"), ''), NULLIF(TRIM("title"), ''), 'Untitled'),
            "content" = COALESCE(NULLIF(TRIM("content"), ''), NULLIF(TRIM("body"), ''), ''),
            "fields" = COALESCE("fields", '[]'::jsonb);
        ELSE
          UPDATE "templates" SET
            "name" = COALESCE(NULLIF(TRIM("name"), ''), NULLIF(TRIM("title"), ''), 'Untitled'),
            "content" = COALESCE(NULLIF(TRIM("content"), ''), ''),
            "fields" = COALESCE("fields", '[]'::jsonb);
        END IF;
        ALTER TABLE "templates" DROP COLUMN "title";
        ALTER TABLE "templates" DROP COLUMN IF EXISTS "body";
        ALTER TABLE "templates" DROP COLUMN IF EXISTS "description";
      END IF;
    END $$;
  `);

  await prisma.$executeRawUnsafe(
    `UPDATE "templates" SET "fields" = COALESCE("fields", '[]'::jsonb) WHERE "fields" IS NULL`
  );
  await prisma.$executeRawUnsafe(
    `UPDATE "templates" SET "name" = COALESCE(NULLIF(TRIM("name"), ''), 'Untitled') WHERE "name" IS NULL`
  );
  await prisma.$executeRawUnsafe(
    `UPDATE "templates" SET "content" = COALESCE("content", '') WHERE "content" IS NULL`
  );

  await prisma.$executeRawUnsafe(`ALTER TABLE "templates" ALTER COLUMN "name" SET NOT NULL`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "templates" ALTER COLUMN "content" SET NOT NULL`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "templates" ALTER COLUMN "fields" SET NOT NULL`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "templates" ALTER COLUMN "fields" SET DEFAULT '[]'::jsonb`);

  console.log("[DB] templates table aligned with Prisma (name, content, fields).");
}
