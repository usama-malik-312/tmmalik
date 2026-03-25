import { prisma } from "../config/prisma.js";

export async function ensureUsersSchema(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "users" (
      "id" SERIAL PRIMARY KEY,
      "fname" TEXT NOT NULL,
      "lname" TEXT NOT NULL,
      "email" TEXT NOT NULL UNIQUE,
      "password" TEXT NOT NULL,
      "address" TEXT NOT NULL,
      "userType" INTEGER NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

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
      },
    });
    console.log("[DB] Default owner user created: tmmalik@email.com");
  }
}

