import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import QRCode from "qrcode";
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
  /** If set, used instead of the stored template body (one-off edits in Document Generator). */
  contentOverride?: string | null;
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

  const source =
    typeof args.contentOverride === "string" && args.contentOverride.trim().length > 0
      ? args.contentOverride
      : template.content;
  const generatedContent = replacePlaceholders(source, args.formData);
  const verificationId = randomUUID();
  const baseUrl = process.env.VERIFY_BASE_URL?.trim() || "http://localhost:5000";
  const verificationUrl = `${baseUrl.replace(/\/$/, "")}/verify/${verificationId}`;
  const qrCode = await QRCode.toDataURL(verificationUrl);

  return prisma.document.create({
    data: {
      templateId: args.templateId,
      caseId: args.caseId ?? null,
      generatedContent,
      verificationId,
      qrCode,
    },
    include: {
      template: true,
      case: { include: { client: true } },
    },
  });
}

export type DocumentListParams = {
  skip: number;
  take: number;
  search?: string;
};

export async function getDocumentsPaged(params: DocumentListParams) {
  const where: Prisma.DocumentWhereInput | undefined = params.search
    ? {
        OR: [
          { generatedContent: { contains: params.search, mode: "insensitive" } },
          { template: { name: { contains: params.search, mode: "insensitive" } } },
        ],
      }
    : undefined;
  const [items, total] = await Promise.all([
    prisma.document.findMany({
      where,
      include: {
        template: true,
        case: { include: { client: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: params.skip,
      take: params.take,
    }),
    prisma.document.count({ where }),
  ]);
  return { items, total };
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

export const getDocumentByVerificationId = (verificationId: string) =>
  prisma.document.findUnique({
    where: { verificationId },
    include: {
      template: true,
      case: { include: { client: true } },
    },
  });

export const updateDocument = (id: number, data: Prisma.DocumentUpdateInput) =>
  prisma.document.update({
    where: { id },
    data,
    include: {
      template: true,
      case: { include: { client: true } },
    },
  });

export const deleteDocument = (id: number) => prisma.document.delete({ where: { id } });
