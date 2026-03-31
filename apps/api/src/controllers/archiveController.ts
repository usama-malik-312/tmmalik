import { NextFunction, Request, Response } from "express";
import * as service from "../services/archiveService.js";
import { parseListQuery } from "../utils/listQuery.js";

function parseOptionalInt(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function uploadArchive(req: Request, res: Response, next: NextFunction) {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, message: "file is required" });
      return;
    }
    const title = String(req.body?.title ?? "").trim();
    const documentType = String(req.body?.documentType ?? "").trim();
    if (!title || !documentType) {
      res.status(400).json({ success: false, message: "title and documentType are required" });
      return;
    }
    const fileUrl = `/uploads/archives/${file.filename}`;
    const entity = await service.createArchive({
      clientId: parseOptionalInt(req.body?.clientId),
      title,
      documentType,
      fileUrl,
      metadata: {
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        cnic: req.body?.cnic ? String(req.body.cnic) : undefined,
        name: req.body?.name ? String(req.body.name) : undefined,
      },
    });
    res.status(201).json({ success: true, data: entity });
  } catch (error) {
    next(error);
  }
}

export async function getArchives(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, pageSize, skip } = parseListQuery(req);
    const cnic = String(req.query?.cnic ?? "").trim() || undefined;
    const name = String(req.query?.name ?? "").trim() || undefined;
    const documentType = String(req.query?.documentType ?? "").trim() || undefined;
    const { items, total } = await service.getArchivesPaged({
      cnic,
      name,
      documentType,
      skip,
      take: pageSize,
    });

    const base = `${req.protocol}://${req.get("host")}`;
    const mapped = items.map((i: (typeof items)[number]) => ({
      ...i,
      fileUrl: i.fileUrl.startsWith("http") ? i.fileUrl : `${base}${i.fileUrl}`,
    }));
    res.json({ success: true, data: { items: mapped, total, page, pageSize } });
  } catch (error) {
    next(error);
  }
}
