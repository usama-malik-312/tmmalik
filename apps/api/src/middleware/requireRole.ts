import { NextFunction, Request, Response } from "express";

export function requireRole(role: "admin" | "staff") {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    if (req.auth.role !== role) {
      res.status(403).json({ success: false, message: "Forbidden" });
      return;
    }
    next();
  };
}
