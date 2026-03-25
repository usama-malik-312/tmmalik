import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export const createUser = (data: Prisma.UserCreateInput) => prisma.user.create({ data });
export const getUsers = () => prisma.user.findMany({ orderBy: { createdAt: "desc" } });
export const getUserById = (id: number) => prisma.user.findUnique({ where: { id } });
export const updateUser = (id: number, data: Prisma.UserUpdateInput) => prisma.user.update({ where: { id }, data });
export const deleteUser = (id: number) => prisma.user.delete({ where: { id } });

