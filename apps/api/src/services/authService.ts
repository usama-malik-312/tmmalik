import { prisma } from "../config/prisma.js";

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.password !== password) {
    throw new Error("Invalid email or password");
  }
  const { password: _pass, ...safeUser } = user;
  return safeUser;
}

