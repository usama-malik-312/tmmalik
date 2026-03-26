import { NextFunction, Request, Response } from "express";
import * as service from "../services/userService.js";
import { parseListQuery } from "../utils/listQuery.js";
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

export async function getUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, pageSize, skip, search } = parseListQuery(req);
    const { items, total } = await service.getUsersPaged({
      skip,
      take: pageSize,
      search: search || undefined,
    });
    res.json({
      success: true,
      data: { items: items.map(stripPassword), total, page, pageSize },
    });
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

