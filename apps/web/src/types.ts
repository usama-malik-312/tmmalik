export type CaseStatus = "draft" | "in_progress" | "completed";

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
  fields: TemplateField[];
  createdAt: string;
}

export interface GeneratedDocument {
  id: number;
  templateId: number;
  caseId: number | null;
  generatedContent: string;
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
