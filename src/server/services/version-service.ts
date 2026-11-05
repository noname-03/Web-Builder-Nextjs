import "server-only";
import { Prisma, type VersionSource } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { normalizeDocument } from "@/features/editor/schemas/document";
import { db } from "@/server/db";
import { findOwnedPage } from "@/server/repositories/page-repository";
import {
  createVersionRecord,
  listVersions,
  pruneVersions,
} from "@/server/repositories/version-repository";

export async function getPageVersions(input: { pageId: string; userId: string }) {
  return listVersions(input);
}

export async function createSnapshot(input: {
  userId: string;
  pageId: string;
  source: VersionSource;
}): Promise<void> {
  const page = await findOwnedPage({ pageId: input.pageId, userId: input.userId });
  if (!page) throw new AppError("NOT_FOUND", "Halaman tidak ditemukan.");

  await db.$transaction(async (tx) => {
    await createVersionRecord(tx, {
      pageId: page.id,
      content: page.content as Prisma.InputJsonValue,
      revision: page.revision,
      source: input.source,
    });
    await pruneVersions(tx, page.id);
  });
}

export async function restoreVersion(input: { userId: string; pageId: string; versionId: string }) {
  const result = await db.$transaction(async (tx) => {
    const version = await tx.pageVersion.findFirst({
      where: {
        id: input.versionId,
        pageId: input.pageId,
        page: { deletedAt: null, project: { userId: input.userId } },
      },
      select: { content: true },
    });
    if (!version) throw new AppError("NOT_FOUND", "Versi tidak ditemukan.");

    const page = await tx.page.findFirst({
      where: {
        id: input.pageId,
        deletedAt: null,
        project: { userId: input.userId, deletedAt: null },
      },
      select: { id: true, content: true, revision: true, title: true },
    });
    if (!page) throw new AppError("NOT_FOUND", "Halaman tidak ditemukan.");

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

  const document = normalizeDocument(result.content, result.title);
  return { revision: result.revision, document };
}
