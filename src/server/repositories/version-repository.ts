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
