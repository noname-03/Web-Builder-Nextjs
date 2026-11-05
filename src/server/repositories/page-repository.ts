import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/server/db";

export async function listPagesByProject(input: { projectId: string; userId: string }) {
  return db.page.findMany({
    where: {
      projectId: input.projectId,
      deletedAt: null,
      project: { userId: input.userId, deletedAt: null },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: { id: true, title: true, slug: true, status: true, updatedAt: true, createdAt: true },
  });
}

export async function findOwnedPage(input: { pageId: string; userId: string }) {
  return db.page.findFirst({
    where: {
      id: input.pageId,
      deletedAt: null,
      project: { userId: input.userId, deletedAt: null },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      content: true,
      revision: true,
      updatedAt: true,
      projectId: true,
      project: { select: { id: true, name: true } },
    },
  });
}

export async function pageSlugExists(input: { projectId: string; slug: string }): Promise<boolean> {
  const found = await db.page.findFirst({
    where: { projectId: input.projectId, slug: input.slug, deletedAt: null },
    select: { id: true },
  });
  return Boolean(found);
}

export async function createPageRecord(input: {
  projectId: string;
  title: string;
  slug: string;
  content: Prisma.InputJsonValue;
}) {
  return db.page.create({
    data: {
      projectId: input.projectId,
      title: input.title,
      slug: input.slug,
      content: input.content,
    },
    select: { id: true, title: true, slug: true },
  });
}

export async function renamePageRecord(input: {
  pageId: string;
  userId: string;
  title: string;
}): Promise<number> {
  const result = await db.page.updateMany({
    where: {
      id: input.pageId,
      deletedAt: null,
      project: { userId: input.userId },
    },
    data: { title: input.title },
  });
  return result.count;
}

export async function softDeletePage(input: { pageId: string; userId: string }): Promise<number> {
  const result = await db.page.updateMany({
    where: {
      id: input.pageId,
      deletedAt: null,
      project: { userId: input.userId, deletedAt: null },
    },
    data: { deletedAt: new Date() },
  });
  return result.count;
}

export async function updatePageContent(input: {
  pageId: string;
  userId: string;
  content: Prisma.InputJsonValue;
  baseRevision: number;
}): Promise<number> {
  const result = await db.page.updateMany({
    where: {
      id: input.pageId,
      revision: input.baseRevision,
      deletedAt: null,
      project: { userId: input.userId, deletedAt: null },
    },
    data: { content: input.content, revision: { increment: 1 } },
  });
  return result.count;
}

export async function getPageRevision(input: { pageId: string }) {
  return db.page.findUnique({ where: { id: input.pageId }, select: { revision: true } });
}
