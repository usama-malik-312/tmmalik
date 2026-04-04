import { prisma } from "../config/prisma.js";

export async function ensureUsersSchema(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "UserRole" AS ENUM ('admin', 'staff');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "users" (
      "id" SERIAL PRIMARY KEY,
      "fname" TEXT NOT NULL,
      "lname" TEXT NOT NULL,
      "email" TEXT NOT NULL UNIQUE,
      "password" TEXT NOT NULL,
      "address" TEXT NOT NULL,
      "userType" INTEGER NOT NULL,
      "role" "UserRole" NOT NULL DEFAULT 'staff',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" "UserRole" DEFAULT 'staff'`);
  await prisma.$executeRawUnsafe(`UPDATE "users" SET "role" = 'admin' WHERE "userType" = -1 AND "role" IS NULL`);
  await prisma.$executeRawUnsafe(`UPDATE "users" SET "role" = 'staff' WHERE "role" IS NULL`);

  const existing = await prisma.user.findUnique({
    where: { email: "tmmalik@email.com" },
  });
  if (!existing) {
    await prisma.user.create({
      data: {
        fname: "Owner",
        lname: "Admin",
        email: "tmmalik@email.com",
        password: "admin123",
        address: "Office",
        userType: -1,
        role: "admin",
      },
    });
    console.log("[DB] Default owner user created: tmmalik@email.com");
  }
}

