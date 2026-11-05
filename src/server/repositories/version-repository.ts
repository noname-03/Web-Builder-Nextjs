import "server-only";
import { Prisma, type VersionSource } from "@prisma/client";
import { db } from "@/server/db";

const MAX_VERSIONS_PER_PAGE = 30;

export async function listVersions(input: { pageId: string; userId: string }) {
  return db.pageVersion.findMany({
    where: {
      pageId: input.pageId,
      page: { deletedAt: null, project: { userId: input.userId } },
    },
    orderBy: { createdAt: "desc" },
    take: MAX_VERSIONS_PER_PAGE,
    select: { id: true, revision: true, source: true, createdAt: true },
  });
}

export async function createVersionRecord(
  tx: Prisma.TransactionClient,
  input: {
    pageId: string;
    content: Prisma.InputJsonValue;
    revision: number;
    source: VersionSource;
  },
): Promise<void> {
  await tx.pageVersion.create({
    data: {
      pageId: input.pageId,
      content: input.content,
      revision: input.revision,
      source: input.source,
    },
  });
}

export async function pruneVersions(tx: Prisma.TransactionClient, pageId: string): Promise<void> {
  const excess = await tx.pageVersion.findMany({
    where: { pageId },
    orderBy: { createdAt: "desc" },
    skip: MAX_VERSIONS_PER_PAGE,
    take: 100,
    select: { id: true },
  });

  if (excess.length > 0) {
    await tx.pageVersion.deleteMany({ where: { id: { in: excess.map((item) => item.id) } } });
  }
}

export async function saveSnapshotWithPrune(input: {
  pageId: string;
  content: Prisma.InputJsonValue;
  revision: number;
  source: VersionSource;
}): Promise<void> {
  await db.$transaction(async (tx) => {
    await createVersionRecord(tx, input);
    await pruneVersions(tx, input.pageId);
  });
}

export async function restoreVersionRecord(input: {
  userId: string;
  pageId: string;
  versionId: string;
}): Promise<{ revision: number; content: Prisma.JsonValue; title: string } | null> {
  return db.$transaction(async (tx) => {
    const version = await tx.pageVersion.findFirst({
      where: {
        id: input.versionId,
        pageId: input.pageId,
        page: { deletedAt: null, project: { userId: input.userId } },
      },
      select: { content: true },
    });
    if (!version) return null;

    const page = await tx.page.findFirst({
      where: {
        id: input.pageId,
        deletedAt: null,
        project: { userId: input.userId, deletedAt: null },
      },
      select: { id: true, content: true, revision: true, title: true },
    });
    if (!page) return null;

    await createVersionRecord(tx, {
      pageId: page.id,
      content: page.content as Prisma.InputJsonValue,
      revision: page.revision,
      source: "RESTORE",
    });

    const updated = await tx.page.update({
      where: { id: page.id },
      data: { content: version.content as Prisma.InputJsonValue, revision: { increment: 1 } },
      select: { revision: true, content: true },
    });

    await pruneVersions(tx, page.id);

    return { revision: updated.revision, content: updated.content, title: page.title };
  });
}
