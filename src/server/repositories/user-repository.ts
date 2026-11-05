import "server-only";
import type { Role } from "@prisma/client";
import { db } from "@/server/db";

export type UserListRecord = {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  _count: { projects: number };
};

export async function findUserByEmail(email: string) {
  return db.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, passwordHash: true, role: true, isActive: true },
  });
}

export async function findUserById(id: string) {
  return db.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });
}

export async function createUser(input: {
  email: string;
  name: string;
  passwordHash: string;
}): Promise<{ id: string }> {
  return db.user.create({
    data: { email: input.email, name: input.name, passwordHash: input.passwordHash },
    select: { id: true },
  });
}

export async function listUsers(input: { query: string; page: number; pageSize: number }) {
  const where = input.query
    ? {
        OR: [
          { email: { contains: input.query, mode: "insensitive" as const } },
          { name: { contains: input.query, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: { select: { projects: { where: { deletedAt: null } } } },
      },
    }),
    db.user.count({ where }),
  ]);

  return { items, total };
}

export async function countActiveAdmins(excludeUserId?: string): Promise<number> {
  return db.user.count({
    where: { role: "ADMIN", isActive: true, ...(excludeUserId ? { id: { not: excludeUserId } } : {}) },
  });
}

export async function updateUserRole(userId: string, role: Role): Promise<void> {
  await db.user.update({ where: { id: userId }, data: { role } });
}

export async function updateUserActive(userId: string, isActive: boolean): Promise<void> {
  await db.user.update({ where: { id: userId }, data: { isActive } });
}

export async function updateUserRoleGuarded(input: {
  userId: string;
  role: Role;
}): Promise<"ok" | "last-admin"> {
  return db.$transaction(async (tx) => {
    const remainingAdmins = await tx.user.count({
      where: { role: "ADMIN", isActive: true, id: { not: input.userId } },
    });
    if (remainingAdmins === 0) return "last-admin";

    await tx.user.update({ where: { id: input.userId }, data: { role: input.role } });
    return "ok";
  });
}

export async function updateUserActiveGuarded(input: {
  userId: string;
  isActive: boolean;
  requireRemainingAdmin: boolean;
}): Promise<"ok" | "last-admin"> {
  return db.$transaction(async (tx) => {
    if (input.requireRemainingAdmin) {
      const remainingAdmins = await tx.user.count({
        where: { role: "ADMIN", isActive: true, id: { not: input.userId } },
      });
      if (remainingAdmins === 0) return "last-admin";
    }

    await tx.user.update({ where: { id: input.userId }, data: { isActive: input.isActive } });
    return "ok";
  });
}
