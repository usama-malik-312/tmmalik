import { NextFunction, Request, Response } from "express";
import * as activityService from "../services/activityService.js";
import * as service from "../services/documentService.js";
import { resolveActorFromRequest } from "../utils/actorFromRequest.js";
import { parseListQuery } from "../utils/listQuery.js";
import { generateDocumentSchema } from "../validators/documentValidator.js";

function parseId(value: string | string[] | undefined): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid document id");
  }
  return id;
}

export async function generateDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = generateDocumentSchema.parse(req.body);
    const actor = await resolveActorFromRequest(req);
    const entity = await service.generateDocument(payload);
    if (entity.caseId != null) {
      await activityService.logDocumentGeneratedForCase(
        entity.caseId,
        entity.id,
        entity.templateId,
        entity.template.name,
        actor
      );
    } else {
      await activityService.logDocumentGeneratedStandalone(
        entity.id,
        entity.templateId,
        entity.template.name,
        actor
      );
    }
    res.status(201).json({ success: true, data: entity });
  } catch (error) {
    next(error);
  }
}

export async function getDocuments(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, pageSize, skip, search } = parseListQuery(req);
    const { items, total } = await service.getDocumentsPaged({
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

export async function getDocumentById(req: Request, res: Response, next: NextFunction) {
  try {
    const entity = await service.getDocumentById(parseId(req.params.id));
    if (!entity) {
      res.status(404).json({ success: false, message: "Document not found" });
      return;
    }
    res.json({ success: true, data: entity });
  } catch (error) {
    next(error);
  }
}

export async function verifyDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const verificationId = String(req.params.id ?? "").trim();
    if (!verificationId) {
      res.status(400).json({ success: false, message: "Invalid verification id" });
      return;
    }
    const entity = await service.getDocumentByVerificationId(verificationId);
    if (!entity) {
      res.status(404).json({ success: false, message: "Document not found" });
      return;
    }
    res.json({
      success: true,
      data: {
        id: entity.id,
        verificationId: entity.verificationId,
        templateName: entity.template?.name ?? null,
        caseId: entity.caseId,
        createdAt: entity.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const generatedContent = String(req.body?.generatedContent ?? "").trim();
    if (!generatedContent) {
      res.status(400).json({ success: false, message: "generatedContent is required" });
      return;
    }
    const entity = await service.updateDocument(id, { generatedContent });
    res.json({ success: true, data: entity });
  } catch (error) {
    next(error);
  }
}

export async function deleteDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const before = await service.getDocumentById(id);
    if (!before) {
      res.status(404).json({ success: false, message: "Document not found" });
      return;
    }
    const actor = await resolveActorFromRequest(req);
    await service.deleteDocument(id);
    await activityService.logDocumentDeleted(id, before.template.name, before.caseId ?? null, actor);
    res.json({ success: true, message: "Document deleted" });
  } catch (error) {
    next(error);
  }
}
