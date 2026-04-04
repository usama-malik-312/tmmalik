import { prisma } from "../config/prisma.js";
import jwt from "jsonwebtoken";

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.password !== password) {
    throw new Error("Invalid email or password");
  }
  const memberships = await prisma.userOrganization.findMany({ where: { userId: user.id } });
  const token = signToken(user.id, user.role);
  const { password: _pass, ...safeUser } = user;
  return { token, user: { ...safeUser, orgIds: memberships.map((m) => m.orgId) } };
}

export async function register(payload: {
  name: string;
  email: string;
  password: string;
  orgName: string;
  role: "admin" | "staff";
}) {
  const [fname, ...rest] = payload.name.trim().split(/\s+/);
  const lname = rest.join(" ") || "User";
  const existing = await prisma.user.findUnique({ where: { email: payload.email } });
  if (existing) throw new Error("Email already exists");

  const created = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({ data: { name: payload.orgName } });
    const user = await tx.user.create({
      data: {
        fname,
        lname,
        email: payload.email,
        password: payload.password,
        address: "N/A",
        userType: payload.role === "admin" ? -1 : 2,
        role: payload.role,
      },
    });
    await tx.userOrganization.create({ data: { userId: user.id, orgId: org.id } });
    return { user, org };
  });

  const token = signToken(created.user.id, created.user.role);
  const { password: _pass, ...safeUser } = created.user;
  return { token, user: { ...safeUser, orgIds: [created.org.id] } };
}

function signToken(userId: number, role: "admin" | "staff") {
  const secret = process.env.JWT_SECRET || "dev-secret";
  return jwt.sign({ userId, role }, secret, { expiresIn: "7d" });
}

