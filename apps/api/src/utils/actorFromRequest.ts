import type { Request } from "express";
import { prisma } from "../config/prisma.js";

export type ActorSnapshot = {
  actorUserId: number | null;
  actorNameSnapshot: string | null;
};

export async function resolveActorFromRequest(req: Request): Promise<ActorSnapshot> {
  const raw = req.headers["x-user-id"];
  if (typeof raw !== "string" || raw.trim() === "") {
    return { actorUserId: null, actorNameSnapshot: null };
  }
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    return { actorUserId: null, actorNameSnapshot: null };
  }
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return { actorUserId: null, actorNameSnapshot: null };
  }
  const name = `${user.fname} ${user.lname}`.trim() || user.email;
  return { actorUserId: id, actorNameSnapshot: name };
}
