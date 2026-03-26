import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export const createUser = (data: Prisma.UserCreateInput) => prisma.user.create({ data });

export type UserListParams = {
  skip: number;
  take: number;
  search?: string;
};

export async function getUsersPaged(params: UserListParams) {
  const where: Prisma.UserWhereInput | undefined = params.search
    ? {
        OR: [
          { fname: { contains: params.search, mode: "insensitive" } },
          { lname: { contains: params.search, mode: "insensitive" } },
          { email: { contains: params.search, mode: "insensitive" } },
          { address: { contains: params.search, mode: "insensitive" } },
        ],
      }
    : undefined;
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: params.skip,
      take: params.take,
    }),
    prisma.user.count({ where }),
  ]);
  return { items, total };
}

export const getUsers = () => prisma.user.findMany({ orderBy: { createdAt: "desc" } });
export const getUserById = (id: number) => prisma.user.findUnique({ where: { id } });
export const updateUser = (id: number, data: Prisma.UserUpdateInput) => prisma.user.update({ where: { id }, data });
export const deleteUser = (id: number) => prisma.user.delete({ where: { id } });

