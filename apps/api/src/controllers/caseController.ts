import { NextFunction, Request, Response } from "express";
import * as service from "../services/caseService.js";
import { caseSchema } from "../validators/caseValidator.js";

function parseId(value: string | string[] | undefined): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid case id");
  }
  return id;
}

export async function createCase(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = caseSchema.parse(req.body);
    const entity = await service.createCase(payload);
    res.status(201).json({ success: true, data: entity });
  } catch (error) {
    next(error);
  }
}

export async function getCases(_req: Request, res: Response, next: NextFunction) {
  try {
    const entities = await service.getCases();
    res.json({ success: true, data: entities });
  } catch (error) {
    next(error);
  }
}

export async function getCaseById(req: Request, res: Response, next: NextFunction) {
  try {
    const entity = await service.getCaseById(parseId(req.params.id));
    if (!entity) {
      res.status(404).json({ success: false, message: "Case not found" });
      return;
    }
    res.json({ success: true, data: entity });
  } catch (error) {
    next(error);
  }
}

export async function updateCase(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = caseSchema.partial().parse(req.body);
    const entity = await service.updateCase(parseId(req.params.id), payload);
    res.json({ success: true, data: entity });
  } catch (error) {
    next(error);
  }
}
