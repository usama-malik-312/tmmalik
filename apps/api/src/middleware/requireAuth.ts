import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export type AuthClaims = {
  userId: number;
  role: "admin" | "staff";
};

declare module "express-serve-static-core" {
  interface Request {
    auth?: AuthClaims;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authz = String(req.headers.authorization ?? "");
  const token = authz.startsWith("Bearer ") ? authz.slice(7).trim() : "";
  if (!token) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }
  const secret = process.env.JWT_SECRET || "dev-secret";
  try {
    const payload = jwt.verify(token, secret) as AuthClaims;
    req.auth = { userId: Number(payload.userId), role: payload.role };
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
}
