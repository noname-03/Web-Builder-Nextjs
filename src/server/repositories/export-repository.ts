import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/server/db";

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
