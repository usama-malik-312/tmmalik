import { NextFunction, Request, Response } from "express";
import * as service from "../services/userService.js";
import { userSchema } from "../validators/userValidator.js";

function parseId(value: string | string[] | undefined): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid user id");
  }
  return id;
}

function stripPassword<T extends { password?: string }>(entity: T) {
  const { password: _password, ...rest } = entity;
  return rest;
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = userSchema.parse(req.body);
    const user = await service.createUser(payload);
    res.status(201).json({ success: true, data: stripPassword(user) });
  } catch (error) {
    next(error);
  }
}

export async function getUsers(_req: Request, res: Response, next: NextFunction) {
  try {
    const users = await service.getUsers();
    res.json({ success: true, data: users.map(stripPassword) });
  } catch (error) {
    next(error);
  }
}

export async function getUserById(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await service.getUserById(parseId(req.params.id));
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    res.json({ success: true, data: stripPassword(user) });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = userSchema.partial().parse(req.body);
    const user = await service.updateUser(parseId(req.params.id), payload);
    res.json({ success: true, data: stripPassword(user) });
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteUser(parseId(req.params.id));
    res.json({ success: true, message: "User deleted" });
  } catch (error) {
    next(error);
  }
}

