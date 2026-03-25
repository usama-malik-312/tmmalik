import { prisma } from "../config/prisma.js";

function replacePlaceholders(input: string, map: Record<string, string>) {
  return input.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_match, rawKey) => {
    const key = String(rawKey).trim();
    return map[key] ?? "";
  });
}

type GenerateArgs = {
  templateId: number;
  caseId?: number | null;
  formData: Record<string, string>;
};

export async function generateDocument(args: GenerateArgs) {
  const template = await prisma.template.findUnique({ where: { id: args.templateId } });
  if (!template) {
    throw new Error("Template not found");
  }

  if (args.caseId != null) {
    const caseEntity = await prisma.case.findUnique({ where: { id: args.caseId } });
    if (!caseEntity) {
      throw new Error("Case not found");
    }
  }

  const generatedContent = replacePlaceholders(template.content, args.formData);

  return prisma.document.create({
    data: {
      templateId: args.templateId,
      caseId: args.caseId ?? null,
      generatedContent,
    },
    include: {
      template: true,
      case: { include: { client: true } },
    },
  });
}

export const getDocuments = () =>
  prisma.document.findMany({
    include: {
      template: true,
      case: { include: { client: true } },
    },
    orderBy: { createdAt: "desc" },
  });

export const getDocumentById = (id: number) =>
  prisma.document.findUnique({
    where: { id },
    include: {
      template: true,
      case: { include: { client: true } },
    },
  });
