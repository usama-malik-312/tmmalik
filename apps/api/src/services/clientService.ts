import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export const createClient = (data: Prisma.ClientCreateInput) => prisma.client.create({ data });
export const getClients = () => prisma.client.findMany({ orderBy: { createdAt: "desc" } });
export const getClientById = (id: number) => prisma.client.findUnique({ where: { id }, include: { cases: true } });
export const updateClient = (id: number, data: Prisma.ClientUpdateInput) => prisma.client.update({ where: { id }, data });
export const deleteClient = (id: number) => prisma.client.delete({ where: { id } });
