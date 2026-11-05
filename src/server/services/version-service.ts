import "server-only";
import { Prisma, type VersionSource } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { normalizeDocument } from "@/features/editor/schemas/document";
import { findOwnedPage } from "@/server/repositories/page-repository";
import {
  listVersions,
  restoreVersionRecord,
  saveSnapshotWithPrune,
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

  await saveSnapshotWithPrune({
    pageId: page.id,
    content: page.content as Prisma.InputJsonValue,
    revision: page.revision,
    source: input.source,
  });
}

export async function restoreVersion(input: { userId: string; pageId: string; versionId: string }) {
  const result = await restoreVersionRecord(input);
  if (!result) throw new AppError("NOT_FOUND", "Versi tidak ditemukan.");

  const document = normalizeDocument(result.content, result.title);
  return { revision: result.revision, document };
}
