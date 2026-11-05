import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { createVersionRecord, pruneVersions } from "@/server/repositories/version-repository";

export async function countRecentExports(userId: string): Promise<number> {
  return db.exportLog.count({
    where: { userId, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
  });
}

export async function createExportLogRecord(
  tx: Prisma.TransactionClient,
  input: { pageId: string; userId: string; revision: number; sizeBytes: number },
): Promise<void> {
  await tx.exportLog.create({
    data: {
      pageId: input.pageId,
      userId: input.userId,
      revision: input.revision,
      sizeBytes: input.sizeBytes,
    },
  });
}

export async function recordExportTransaction(input: {
  pageId: string;
  userId: string;
  revision: number;
  content: Prisma.JsonValue;
  sizeBytes: number;
}): Promise<void> {
  await db.$transaction(async (tx) => {
    await createVersionRecord(tx, {
      pageId: input.pageId,
      content: input.content as Prisma.InputJsonValue,
      revision: input.revision,
      source: "EXPORT",
    });
    await pruneVersions(tx, input.pageId);
    await createExportLogRecord(tx, {
      pageId: input.pageId,
      userId: input.userId,
      revision: input.revision,
      sizeBytes: input.sizeBytes,
    });
  });
}
