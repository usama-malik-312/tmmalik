import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    res.status(400).json({ success: false, message: "Validation failed", errors: error.issues });
    return;
  }

  const message = error instanceof Error ? error.message : "Internal server error";
  res.status(500).json({ success: false, message });
}
