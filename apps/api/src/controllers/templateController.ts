import type { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import * as activityService from "../services/activityService.js";
import * as service from "../services/templateService.js";
import { resolveActorFromRequest } from "../utils/actorFromRequest.js";
import { templateSchema } from "../validators/templateValidator.js";
import { parseListQuery } from "../utils/listQuery.js";

function parseId(value: string | string[] | undefined): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid template id");
  }
  return id;
}

export async function createTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = templateSchema.parse(req.body);
    const actor = await resolveActorFromRequest(req);
    const entity = await service.createTemplate({
      name: payload.name,
      content: payload.content.normalize("NFC"),
      language: payload.language,
      fields: payload.fields as Prisma.InputJsonValue,
    });
    await activityService.logTemplateCreated(entity.id, entity.name, actor);
    res.status(201).json({ success: true, data: entity });
  } catch (error) {
    next(error);
  }
}

export async function getTemplates(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, pageSize, skip, search } = parseListQuery(req);
    const { items, total } = await service.getTemplatesPaged({
      skip,
      take: pageSize,
      search: search || undefined,
    });
    res.json({
      success: true,
      data: { items, total, page, pageSize },
    });
  } catch (error) {
    next(error);
  }
}

export async function getTemplateById(req: Request, res: Response, next: NextFunction) {
  try {
    const entity = await service.getTemplateById(parseId(req.params.id));
    if (!entity) {
      res.status(404).json({ success: false, message: "Template not found" });
      return;
    }
    res.json({ success: true, data: entity });
  } catch (error) {
    next(error);
  }
}

export async function updateTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = templateSchema.partial().parse(req.body);
    const actor = await resolveActorFromRequest(req);
    const entity = await service.updateTemplate(parseId(req.params.id), {
      ...payload,
      content: typeof payload.content === "string" ? payload.content.normalize("NFC") : payload.content,
    });
    await activityService.logTemplateUpdated(entity.id, entity.name, actor);
    res.json({ success: true, data: entity });
  } catch (error) {
    next(error);
  }
}

export async function deleteTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const existing = await service.getTemplateById(id);
    if (!existing) {
      res.status(404).json({ success: false, message: "Template not found" });
      return;
    }
    const actor = await resolveActorFromRequest(req);
    const docCount = await service.deleteTemplate(id);
    await activityService.logTemplateDeleted(id, existing.name, docCount, actor);
    res.json({ success: true, message: "Template deleted" });
  } catch (error) {
    next(error);
  }
}
