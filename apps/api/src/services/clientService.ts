import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export const createClient = (data: Prisma.ClientCreateInput) => prisma.client.create({ data });

export type ClientListParams = {
  skip: number;
  take: number;
  search?: string;
  name?: string;
  cnic?: string;
  phone?: string;
};

function buildClientWhere(params: ClientListParams): Prisma.ClientWhereInput {
  const and: Prisma.ClientWhereInput[] = [];
  if (params.name) {
    and.push({ name: { contains: params.name, mode: "insensitive" } });
  }
  if (params.cnic) {
    and.push({ cnic: { contains: params.cnic, mode: "insensitive" } });
  }
  if (params.phone) {
    and.push({ phone: { contains: params.phone, mode: "insensitive" } });
  }
  if (params.search) {
    const s = params.search;
    and.push({
      OR: [
        { name: { contains: s, mode: "insensitive" } },
        { cnic: { contains: s, mode: "insensitive" } },
        { phone: { contains: s, mode: "insensitive" } },
        { address: { contains: s, mode: "insensitive" } },
      ],
    });
  }
  return and.length ? { AND: and } : {};
}

export async function getClientsPaged(params: ClientListParams) {
  const where = buildClientWhere(params);
  const [items, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: params.skip,
      take: params.take,
    }),
    prisma.client.count({ where }),
  ]);
  return { items, total };
}

export const getClients = () => prisma.client.findMany({ orderBy: { createdAt: "desc" } });
export const getClientById = (id: number) => prisma.client.findUnique({ where: { id }, include: { cases: true } });
export const updateClient = (id: number, data: Prisma.ClientUpdateInput) => prisma.client.update({ where: { id }, data });
export const deleteClient = (id: number) => prisma.client.delete({ where: { id } });

export async function countClients() {
  return prisma.client.count();
}
