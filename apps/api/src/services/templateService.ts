import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export type TemplateCreatePayload = {
  name: string;
  content: string;
  fields: Prisma.InputJsonValue;
};

export const createTemplate = (data: TemplateCreatePayload) =>
  prisma.template.create({
    data: {
      name: data.name,
      content: data.content,
      fields: data.fields,
    },
  });

export const getTemplates = () => prisma.template.findMany({ orderBy: { createdAt: "desc" } });

export type TemplateListParams = {
  skip: number;
  take: number;
  search?: string;
};

export async function getTemplatesPaged(params: TemplateListParams) {
  const where: Prisma.TemplateWhereInput | undefined = params.search
    ? {
        OR: [
          { name: { contains: params.search, mode: "insensitive" } },
          { content: { contains: params.search, mode: "insensitive" } },
        ],
      }
    : undefined;
  const [items, total] = await Promise.all([
    prisma.template.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: params.skip,
      take: params.take,
    }),
    prisma.template.count({ where }),
  ]);
  return { items, total };
}
export const getTemplateById = (id: number) => prisma.template.findUnique({ where: { id } });
export const updateTemplate = (id: number, data: Prisma.TemplateUpdateInput) =>
  prisma.template.update({ where: { id }, data });
export const deleteTemplate = (id: number) =>
  prisma.$transaction(async (tx) => {
    await tx.document.deleteMany({ where: { templateId: id } });
    await tx.template.delete({ where: { id } });
  });
