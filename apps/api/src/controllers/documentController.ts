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

function wantsHtml(req: Request): boolean {
  if (String(req.query.format ?? "").toLowerCase() === "json") return false;
  const accept = String(req.headers.accept ?? "");
  return accept.includes("text/html") || accept.includes("*/*");
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderVerifyPage(args: {
  title: string;
  badge: string;
  badgeColor: string;
  rows: Array<{ label: string; value: string }>;
}) {
  const rowsHtml = args.rows
    .map(
      (r) =>
        `<tr><th>${escapeHtml(r.label)}</th><td>${escapeHtml(r.value)}</td></tr>`
    )
    .join("");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(args.title)}</title>
  <style>
    body { font-family: Segoe UI, Arial, sans-serif; background:#f5f7fb; margin:0; }
    .wrap { max-width: 760px; margin: 48px auto; padding: 0 16px; }
    .card { background:#fff; border-radius:14px; box-shadow:0 8px 24px rgba(15,23,42,.08); padding:24px; }
    .badge { display:inline-block; padding:6px 12px; border-radius:999px; color:#fff; font-weight:600; background:${args.badgeColor}; }
    h1 { margin:12px 0 8px; font-size:24px; color:#0f172a; }
    p { margin:0 0 16px; color:#475569; }
    table { width:100%; border-collapse: collapse; margin-top: 8px; }
    th, td { text-align:left; padding:10px 8px; border-bottom:1px solid #e2e8f0; vertical-align:top; }
    th { width:220px; color:#334155; font-weight:600; }
    td { color:#0f172a; word-break: break-word; }
    .footer { margin-top:18px; color:#64748b; font-size:12px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <span class="badge">${escapeHtml(args.badge)}</span>
      <h1>${escapeHtml(args.title)}</h1>
      <p>Document verification details from Legal & Property Management System.</p>
      <table>${rowsHtml}</table>
      <div class="footer">Tip: append <code>?format=json</code> for API JSON response.</div>
    </div>
  </div>
</body>
</html>`;
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
      if (wantsHtml(req)) {
        res.status(400).type("html").send(
          renderVerifyPage({
            title: "Invalid verification link",
            badge: "INVALID",
            badgeColor: "#f59e0b",
            rows: [{ label: "Reason", value: "Verification id is missing or invalid." }],
          })
        );
        return;
      }
      res.status(400).json({ success: false, message: "Invalid verification id" });
      return;
    }
    const entity = await service.getDocumentByVerificationId(verificationId);
    if (!entity) {
      if (wantsHtml(req)) {
        res.status(404).type("html").send(
          renderVerifyPage({
            title: "Document not found",
            badge: "NOT FOUND",
            badgeColor: "#ef4444",
            rows: [{ label: "Verification ID", value: verificationId }],
          })
        );
        return;
      }
      res.status(404).json({ success: false, message: "Document not found" });
      return;
    }
    if (wantsHtml(req)) {
      res.status(200).type("html").send(
        renderVerifyPage({
          title: "Document verified",
          badge: "VALID",
          badgeColor: "#16a34a",
          rows: [
            { label: "Verification ID", value: entity.verificationId },
            { label: "Document ID", value: String(entity.id) },
            { label: "Template", value: entity.template?.name ?? "N/A" },
            { label: "Case", value: entity.caseId != null ? `#${entity.caseId}` : "Not linked" },
            { label: "Created At", value: new Date(entity.createdAt).toLocaleString() },
          ],
        })
      );
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

export async function duplicateDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const source = await service.getDocumentById(id);
    if (!source) {
      res.status(404).json({ success: false, message: "Document not found" });
      return;
    }
    const actor = await resolveActorFromRequest(req);
    const entity = await service.duplicateDocument(id);
    if (!entity) {
      res.status(404).json({ success: false, message: "Document not found" });
      return;
    }
    await activityService.logDocumentDuplicated(
      id,
      entity.id,
      source.template.name,
      source.caseId ?? null,
      actor
    );
    res.status(201).json({ success: true, data: entity });
  } catch (error) {
    next(error);
  }
}
