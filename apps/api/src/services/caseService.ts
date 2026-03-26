import { CaseStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export const createCase = (data: Prisma.CaseUncheckedCreateInput) => prisma.case.create({ data, include: { client: true } });

export type CaseListParams = {
  skip: number;
  take: number;
  search?: string;
  status?: string;
  caseType?: string;
};

function buildCaseWhere(params: CaseListParams): Prisma.CaseWhereInput {
  const and: Prisma.CaseWhereInput[] = [];
  if (params.status) {
    const allowed = new Set<string>(["draft", "in_progress", "completed"]);
    if (allowed.has(params.status)) {
      and.push({ status: params.status as CaseStatus });
    }
  }
  if (params.caseType) {
    and.push({ caseType: { contains: params.caseType, mode: "insensitive" } });
  }
  if (params.search) {
    const s = params.search;
    and.push({
      OR: [
        { caseType: { contains: s, mode: "insensitive" } },
        { propertyDetails: { contains: s, mode: "insensitive" } },
        { notes: { contains: s, mode: "insensitive" } },
        { client: { name: { contains: s, mode: "insensitive" } } },
        { client: { cnic: { contains: s, mode: "insensitive" } } },
      ],
    });
  }
  return and.length ? { AND: and } : {};
}

export async function getCasesPaged(params: CaseListParams) {
  const where = buildCaseWhere(params);
  const [items, total] = await Promise.all([
    prisma.case.findMany({
      where,
      include: { client: true },
      orderBy: { createdAt: "desc" },
      skip: params.skip,
      take: params.take,
    }),
    prisma.case.count({ where }),
  ]);
  return { items, total };
}

export const getCases = () => prisma.case.findMany({ include: { client: true }, orderBy: { createdAt: "desc" } });
export const getCaseById = (id: number) => prisma.case.findUnique({ where: { id }, include: { client: true } });
export const updateCase = (id: number, data: Prisma.CaseUpdateInput) => prisma.case.update({ where: { id }, data, include: { client: true } });

export async function countCases() {
  return prisma.case.count();
}
