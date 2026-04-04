import { NextFunction, Request, Response } from "express";

export function ownerOnly(req: Request, res: Response, next: NextFunction) {
  if (req.auth?.role === "admin") {
    next();
    return;
  }
  const userType = Number(req.headers["x-user-type"]);
  if (userType !== -1) {
    res.status(403).json({ success: false, message: "Owner access required" });
    return;
  }
  next();
}

