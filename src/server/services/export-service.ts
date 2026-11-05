import "server-only";
import type { Prisma } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { normalizeDocument } from "@/features/editor/schemas/document";
import { renderHtml } from "@/features/export/render-html";
import { countRecentExports, recordExportTransaction } from "@/server/repositories/export-repository";
import { findOwnedPage } from "@/server/repositories/page-repository";

const MAX_EXPORTS_PER_HOUR = 20;

export async function preparePageExport(input: { pageId: string; userId: string }) {
  const page = await findOwnedPage(input);
  if (!page) throw new AppError("NOT_FOUND", "Halaman tidak ditemukan.");

  const document = normalizeDocument(page.content, page.title);
  const html = renderHtml(document);

  return { page, html, sizeBytes: new TextEncoder().encode(html).length };
}

export async function recordPageExport(input: {
  pageId: string;
  userId: string;
  revision: number;
  content: Prisma.JsonValue;
  sizeBytes: number;
}): Promise<void> {
  const recentExports = await countRecentExports(input.userId);
  if (recentExports >= MAX_EXPORTS_PER_HOUR) {
    throw new AppError("RATE_LIMITED", "Batas export per jam tercapai. Coba lagi nanti.");
  }

  await recordExportTransaction(input);
}
