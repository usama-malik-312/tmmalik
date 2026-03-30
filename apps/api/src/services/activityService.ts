import { ActivityEntityType, CaseStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import type { ActorSnapshot } from "../utils/actorFromRequest.js";

function actorCols(actor: ActorSnapshot): Pick<Prisma.ActivityUncheckedCreateInput, "actorUserId" | "actorNameSnapshot"> {
  return {
    actorUserId: actor.actorUserId ?? null,
    actorNameSnapshot: actor.actorNameSnapshot ?? null,
  };
}

export async function getActivitiesForCase(caseId: number) {
  return prisma.activity.findMany({
    where: {
      entityType: ActivityEntityType.case,
      entityId: String(caseId),
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getRecentActivities(limit = 50) {
  const take = Math.min(Math.max(limit, 1), 100);
  return prisma.activity.findMany({
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function createActivityTx(
  tx: Prisma.TransactionClient,
  data: Prisma.ActivityUncheckedCreateInput,
  actor: ActorSnapshot
) {
  return tx.activity.create({ data: { ...data, ...actorCols(actor) } });
}

export async function logActivity(data: Prisma.ActivityUncheckedCreateInput, actor: ActorSnapshot) {
  return prisma.activity.create({ data: { ...data, ...actorCols(actor) } });
}

export async function logCaseStatusChanged(caseId: number, from: CaseStatus, to: CaseStatus, actor: ActorSnapshot) {
  return logActivity(
    {
      entityType: ActivityEntityType.case,
      entityId: String(caseId),
      action: "status_changed",
      metadata: { from, to },
    },
    actor
  );
}

export async function logDocumentGeneratedForCase(
  caseId: number,
  documentId: number,
  templateId: number,
  templateName: string,
  actor: ActorSnapshot
) {
  return logActivity(
    {
      entityType: ActivityEntityType.case,
      entityId: String(caseId),
      action: "document_generated",
      metadata: { documentId, templateId, templateName },
    },
    actor
  );
}

/** Standalone document (no linked case). */
export async function logDocumentGeneratedStandalone(
  documentId: number,
  templateId: number,
  templateName: string,
  actor: ActorSnapshot
) {
  return logActivity(
    {
      entityType: ActivityEntityType.document,
      entityId: String(documentId),
      action: "document_generated",
      metadata: { templateId, templateName },
    },
    actor
  );
}

export async function logDocumentUpdated(
  documentId: number,
  templateName: string,
  caseId: number | null,
  actor: ActorSnapshot
) {
  if (caseId != null) {
    return logActivity(
      {
        entityType: ActivityEntityType.case,
        entityId: String(caseId),
        action: "document_updated",
        metadata: { documentId, templateName },
      },
      actor
    );
  }
  return logActivity(
    {
      entityType: ActivityEntityType.document,
      entityId: String(documentId),
      action: "document_updated",
      metadata: { templateName },
    },
    actor
  );
}

export async function logDocumentDeleted(
  documentId: number,
  templateName: string,
  caseId: number | null,
  actor: ActorSnapshot
) {
  if (caseId != null) {
    return logActivity(
      {
        entityType: ActivityEntityType.case,
        entityId: String(caseId),
        action: "document_deleted",
        metadata: { documentId, templateName },
      },
      actor
    );
  }
  return logActivity(
    {
      entityType: ActivityEntityType.document,
      entityId: String(documentId),
      action: "document_deleted",
      metadata: { templateName },
    },
    actor
  );
}

export async function logTemplateCreated(templateId: number, name: string, actor: ActorSnapshot) {
  return logActivity(
    {
      entityType: ActivityEntityType.template,
      entityId: String(templateId),
      action: "template_created",
      metadata: { name },
    },
    actor
  );
}

export async function logTemplateUpdated(templateId: number, name: string, actor: ActorSnapshot) {
  return logActivity(
    {
      entityType: ActivityEntityType.template,
      entityId: String(templateId),
      action: "template_updated",
      metadata: { name },
    },
    actor
  );
}

export async function logTemplateDeleted(
  templateId: number,
  name: string,
  cascadeDeletedDocuments: number,
  actor: ActorSnapshot
) {
  return logActivity(
    {
      entityType: ActivityEntityType.template,
      entityId: String(templateId),
      action: "template_deleted",
      metadata: { name, cascadeDeletedDocuments },
    },
    actor
  );
}

export async function logClientCreated(clientId: number, name: string, actor: ActorSnapshot) {
  return logActivity(
    {
      entityType: ActivityEntityType.client,
      entityId: String(clientId),
      action: "client_created",
      metadata: { name },
    },
    actor
  );
}

export async function logClientUpdated(clientId: number, name: string, actor: ActorSnapshot) {
  return logActivity(
    {
      entityType: ActivityEntityType.client,
      entityId: String(clientId),
      action: "client_updated",
      metadata: { name },
    },
    actor
  );
}

export async function logClientDeleted(clientId: number, name: string, actor: ActorSnapshot) {
  return logActivity(
    {
      entityType: ActivityEntityType.client,
      entityId: String(clientId),
      action: "client_deleted",
      metadata: { name },
    },
    actor
  );
}
