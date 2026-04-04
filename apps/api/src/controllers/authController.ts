import { NextFunction, Request, Response } from "express";
import { loginSchema, registerSchema } from "../validators/authValidator.js";
import * as authService from "../services/authService.js";
import * as userService from "../services/userService.js";

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = loginSchema.parse(req.body);
    const user = await authService.login(payload.email, payload.password);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = registerSchema.parse(req.body);
    const entity = await authService.register(payload);
    res.status(201).json({ success: true, data: entity });
  } catch (error) {
    next(error);
  }
}

export async function logout(_req: Request, res: Response, _next: NextFunction) {
  res.json({ success: true, message: "Logged out" });
}

function parseUserId(value: string | string[] | undefined): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Missing/invalid user id");
  }
  return id;
}

function stripPassword<T extends { password?: string }>(entity: T) {
  const { password: _password, ...rest } = entity;
  return rest;
}

export async function meGet(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.userId ?? parseUserId(req.headers["x-user-id"] as string | undefined);
    const user = await userService.getUserById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    res.json({ success: true, data: stripPassword(user) });
  } catch (error) {
    next(error);
  }
}

export async function meUpdate(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.userId ?? parseUserId(req.headers["x-user-id"] as string | undefined);
    const payload = req.body as Partial<{
      fname: string;
      lname: string;
      address: string;
      password: string;
    }>;

    const updateData: Record<string, unknown> = {};
    if (payload.fname !== undefined) updateData.fname = payload.fname;
    if (payload.lname !== undefined) updateData.lname = payload.lname;
    if (payload.address !== undefined) updateData.address = payload.address;
    if (payload.password !== undefined) updateData.password = payload.password;

    const user = await userService.updateUser(userId, updateData as any);
    res.json({ success: true, data: stripPassword(user) });
  } catch (error) {
    next(error);
  }
}

