import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export const createCase = (data: Prisma.CaseUncheckedCreateInput) => prisma.case.create({ data, include: { client: true } });
export const getCases = () => prisma.case.findMany({ include: { client: true }, orderBy: { createdAt: "desc" } });
export const getCaseById = (id: number) => prisma.case.findUnique({ where: { id }, include: { client: true } });
export const updateCase = (id: number, data: Prisma.CaseUpdateInput) => prisma.case.update({ where: { id }, data, include: { client: true } });
