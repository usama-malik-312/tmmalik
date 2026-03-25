import { NextFunction, Request, Response } from "express";
import * as service from "../services/documentService.js";
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
    const entity = await service.generateDocument(payload);
    res.status(201).json({ success: true, data: entity });
  } catch (error) {
    next(error);
  }
}

export async function getDocuments(_req: Request, res: Response, next: NextFunction) {
  try {
    const entities = await service.getDocuments();
    res.json({ success: true, data: entities });
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
