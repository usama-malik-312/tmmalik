import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export type CreateArchivePayload = {
  clientId?: number | null;
  title: string;
  documentType: string;
  fileUrl: string;
  metadata?: Prisma.InputJsonValue | null;
};

export function createArchive(data: CreateArchivePayload) {
  return prisma.archive.create({
    data: {
      clientId: data.clientId ?? null,
      title: data.title,
      documentType: data.documentType,
      fileUrl: data.fileUrl,
      metadata: data.metadata === null ? Prisma.JsonNull : data.metadata ?? undefined,
    },
    include: { client: true },
  });
}

export type ArchiveListParams = {
  cnic?: string;
  name?: string;
  documentType?: string;
  skip: number;
  take: number;
};

export async function getArchivesPaged(params: ArchiveListParams) {
  const and: Prisma.ArchiveWhereInput[] = [];
  if (params.cnic) and.push({ client: { cnic: { contains: params.cnic, mode: "insensitive" } } });
  if (params.name) and.push({ client: { name: { contains: params.name, mode: "insensitive" } } });
  if (params.documentType) and.push({ documentType: { contains: params.documentType, mode: "insensitive" } });
  const where: Prisma.ArchiveWhereInput = and.length ? { AND: and } : {};
  const [items, total] = await Promise.all([
    prisma.archive.findMany({
      where,
      include: { client: true },
      orderBy: { createdAt: "desc" },
      skip: params.skip,
      take: params.take,
    }),
    prisma.archive.count({ where }),
  ]);
  return { items, total };
}
