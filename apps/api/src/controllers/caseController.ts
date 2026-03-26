import { NextFunction, Request, Response } from "express";
import * as service from "../services/caseService.js";
import { optionalQueryString, parseListQuery } from "../utils/listQuery.js";
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

export async function getCases(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, pageSize, skip, search } = parseListQuery(req);
    const status = optionalQueryString(req, "status");
    const caseType = optionalQueryString(req, "caseType");
    const { items, total } = await service.getCasesPaged({
      skip,
      take: pageSize,
      search: search || undefined,
      status,
      caseType,
    });
    res.json({
      success: true,
      data: { items, total, page, pageSize },
    });
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
