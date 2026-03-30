import { NextFunction, Request, Response } from "express";
import * as activityService from "../services/activityService.js";
import * as service from "../services/caseService.js";
import { resolveActorFromRequest } from "../utils/actorFromRequest.js";
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
    const actor = await resolveActorFromRequest(req);
    const entity = await service.createCase(payload, actor);
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
    const id = parseId(req.params.id);
    const before = await service.getCaseById(id);
    if (!before) {
      res.status(404).json({ success: false, message: "Case not found" });
      return;
    }
    const payload = caseSchema.partial().parse(req.body);
    const actor = await resolveActorFromRequest(req);
    const entity = await service.updateCase(id, payload);
    if (payload.status !== undefined && payload.status !== before.status) {
      await activityService.logCaseStatusChanged(id, before.status, entity.status, actor);
    }
    res.json({ success: true, data: entity });
  } catch (error) {
    next(error);
  }
}

export async function getCaseActivities(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const c = await service.getCaseById(id);
    if (!c) {
      res.status(404).json({ success: false, message: "Case not found" });
      return;
    }
    const items = await activityService.getActivitiesForCase(id);
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
}
