import type { ActivityItem } from "../types";

/** Human-readable description for an activity row (timeline + global feed). */
export function describeActivity(a: ActivityItem): string {
  const m = a.metadata as Record<string, unknown> | null;
  switch (a.action) {
    case "case_created":
      return "Case created";
    case "status_changed": {
      const from = m?.from as string | undefined;
      const to = m?.to as string | undefined;
      return `Status changed: ${from ?? "?"} → ${to ?? "?"}`;
    }
    case "document_generated": {
      const name = m?.templateName as string | undefined;
      return name ? `Document generated: ${name}` : "Document generated";
    }
    case "document_updated": {
      const name = m?.templateName as string | undefined;
      return name ? `Document updated: ${name}` : "Document updated";
    }
    case "document_deleted": {
      const name = m?.templateName as string | undefined;
      return name ? `Document deleted: ${name}` : "Document deleted";
    }
    case "template_created": {
      const name = m?.name as string | undefined;
      return name ? `Template created: ${name}` : "Template created";
    }
    case "template_updated": {
      const name = m?.name as string | undefined;
      return name ? `Template updated: ${name}` : "Template updated";
    }
    case "template_deleted": {
      const name = m?.name as string | undefined;
      const n = m?.cascadeDeletedDocuments as number | undefined;
      const extra = typeof n === "number" ? ` (${n} linked document(s) removed)` : "";
      return name ? `Template deleted: ${name}${extra}` : `Template deleted${extra}`;
    }
    case "client_created": {
      const name = m?.name as string | undefined;
      return name ? `Client created: ${name}` : "Client created";
    }
    case "client_updated": {
      const name = m?.name as string | undefined;
      return name ? `Client updated: ${name}` : "Client updated";
    }
    case "client_deleted": {
      const name = m?.name as string | undefined;
      return name ? `Client deleted: ${name}` : "Client deleted";
    }
    default:
      return a.action;
  }
}

export function performerLabel(a: ActivityItem): string {
  return a.actorNameSnapshot?.trim() || "Unknown user";
}
