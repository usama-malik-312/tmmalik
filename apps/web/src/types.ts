export type CaseStatus = "draft" | "in_progress" | "submitted" | "completed" | "rejected";

export type ActivityEntityType = "client" | "case" | "document" | "template";

export interface ActivityItem {
  id: string;
  entityType: ActivityEntityType;
  entityId: string;
  action: string;
  metadata: Record<string, unknown> | null;
  actorUserId: number | null;
  actorNameSnapshot: string | null;
  createdAt: string;
}

export interface Client {
  id: number;
  name: string;
  cnic: string;
  phone: string;
  address: string;
  notes?: string;
  createdAt: string;
}

export interface CaseItem {
  id: number;
  clientId: number;
  caseType: string;
  status: CaseStatus;
  propertyDetails: string;
  notes: string;
  feeType?: string | null;
  feeAmount?: number | null;
  stampDuty?: number | null;
  cvt?: number | null;
  totalFee?: number | null;
  createdAt: string;
  client?: Client;
}

export type TemplateFieldSection = "client" | "transaction" | "general";
export type TemplateFieldInput = "text" | "textarea" | "date";

export interface TemplateField {
  name: string;
  label: string;
  section?: TemplateFieldSection;
  input?: TemplateFieldInput;
}

export interface Template {
  id: number;
  name: string;
  content: string;
  language?: "en" | "ur";
  fields: TemplateField[];
  createdAt: string;
}

export interface GeneratedDocument {
  id: number;
  templateId: number;
  caseId: number | null;
  generatedContent: string;
  qrCode?: string | null;
  verificationId: string;
  createdAt: string;
  template?: Template;
  case?: CaseItem | null;
}

export interface User {
  id: number;
  fname: string;
  lname: string;
  email: string;
  address: string;
  userType: -1 | 1 | 2;
  createdAt: string;
}

export interface ArchiveItem {
  id: number;
  clientId: number | null;
  title: string;
  documentType: string;
  fileUrl: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  client?: Client | null;
}
