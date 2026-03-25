import { NextFunction, Request, Response } from "express";
import { loginSchema } from "../validators/authValidator.js";
import * as authService from "../services/authService.js";

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = loginSchema.parse(req.body);
    const user = await authService.login(payload.email, payload.password);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function logout(_req: Request, res: Response, _next: NextFunction) {
  res.json({ success: true, message: "Logged out" });
}

