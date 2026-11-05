import "server-only";
import { db } from "@/server/db";

export async function listProjectsByUser(input: { userId: string; page: number; pageSize: number }) {
  const where = { userId: input.userId, deletedAt: null };

  const [items, total] = await Promise.all([
    db.project.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
      select: {
        id: true,
        name: true,
        description: true,
        updatedAt: true,
        createdAt: true,
        _count: { select: { pages: { where: { deletedAt: null } } } },
      },
    }),
    db.project.count({ where }),
  ]);

  return { items, total };
}

export async function findOwnedProject(input: { projectId: string; userId: string }) {
  return db.project.findFirst({
    where: { id: input.projectId, userId: input.userId, deletedAt: null },
    select: { id: true, name: true, description: true, createdAt: true, updatedAt: true },
  });
}

export async function createProjectRecord(input: {
  userId: string;
  name: string;
  description: string | null;
}) {
  return db.project.create({
    data: { userId: input.userId, name: input.name, description: input.description },
    select: { id: true, name: true },
  });
}

export async function renameProjectRecord(input: {
  projectId: string;
  userId: string;
  name: string;
}): Promise<number> {
  const result = await db.project.updateMany({
    where: { id: input.projectId, userId: input.userId, deletedAt: null },
    data: { name: input.name },
  });
  return result.count;
}

export async function softDeleteProject(input: { projectId: string; userId: string }): Promise<number> {
  const result = await db.project.updateMany({
    where: { id: input.projectId, userId: input.userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return result.count;
}
