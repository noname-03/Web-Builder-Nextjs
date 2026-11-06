import "server-only";
import { Prisma } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { slugify, slugWithSuffix } from "@/lib/slug";
import {
  assertContentSize,
  createEmptyDocument,
  normalizeDocument,
  parseDocument,
  type BuilderDocument,
} from "@/features/editor/schemas/document";
import { isUniqueConstraintError } from "@/server/prisma-errors";
import {
  createPageRecord,
  findOwnedPage,
  findPublishedPageByPublicSlug,
  getPageRevision,
  listPagesByProject,
  pageSlugExists,
  PublicSlugUnavailableError,
  publishPageRecord,
  renamePageRecord,
  softDeletePage,
  unpublishPageRecord,
  updatePageContent,
} from "@/server/repositories/page-repository";
import { findOwnedProject } from "@/server/repositories/project-repository";
import { findTemplateById } from "@/server/repositories/template-repository";

const MAX_SLUG_ATTEMPTS = 20;

function toJson(doc: BuilderDocument): Prisma.InputJsonValue {
  return doc as unknown as Prisma.InputJsonValue;
}

async function createWithUniqueSlug(input: {
  projectId: string;
  title: string;
  content: BuilderDocument;
}) {
  const baseSlug = slugify(input.title);

  for (let attempt = 1; attempt <= MAX_SLUG_ATTEMPTS; attempt++) {
    const slug = slugWithSuffix(baseSlug, attempt);
    const exists = await pageSlugExists({ projectId: input.projectId, slug });
    if (exists) continue;

    try {
      return await createPageRecord({
        projectId: input.projectId,
        title: input.title,
        slug,
        content: toJson(input.content),
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) continue;
      throw error;
    }
  }

  throw new AppError("CONFLICT", "Gagal membuat slug unik. Coba judul lain.");
}

export async function listPages(input: { projectId: string; userId: string }) {
  return listPagesByProject(input);
}

export async function getPageForEditor(input: { pageId: string; userId: string }) {
  const page = await findOwnedPage(input);
  if (!page) throw new AppError("NOT_FOUND", "Halaman tidak ditemukan.");

  let document: BuilderDocument;
  let documentIsValid = true;
  try {
    document = normalizeDocument(page.content, page.title);
  } catch {
    document = createEmptyDocument(page.title);
    documentIsValid = false;
  }

  return {
    id: page.id,
    title: page.title,
    slug: page.slug,
    status: page.status,
    revision: page.revision,
    updatedAt: page.updatedAt,
    projectId: page.projectId,
    projectName: page.project.name,
    isPublished: page.isPublished,
    publicSlug: page.publicSlug,
    document,
    documentIsValid,
  };
}

export async function createPage(input: {
  userId: string;
  projectId: string;
  title: string;
  templateId?: string | null;
}) {
  const project = await findOwnedProject({ projectId: input.projectId, userId: input.userId });
  if (!project) throw new AppError("NOT_FOUND", "Project tidak ditemukan.");

  let content = createEmptyDocument(input.title);

  if (input.templateId) {
    const template = await findTemplateById(input.templateId);
    if (!template || !template.isActive) {
      throw new AppError("NOT_FOUND", "Template tidak ditemukan.");
    }
    content = parseDocument(template.content);
  }

  return createWithUniqueSlug({
    projectId: input.projectId,
    title: input.title.trim(),
    content,
  });
}

export async function renamePage(input: { userId: string; pageId: string; title: string }): Promise<void> {
  const count = await renamePageRecord({ userId: input.userId, pageId: input.pageId, title: input.title.trim() });
  if (count === 0) throw new AppError("NOT_FOUND", "Halaman tidak ditemukan.");
}

export async function deletePage(input: { userId: string; pageId: string }): Promise<void> {
  const count = await softDeletePage(input);
  if (count === 0) throw new AppError("NOT_FOUND", "Halaman tidak ditemukan.");
}

export async function publishPage(input: {
  userId: string;
  pageId: string;
}): Promise<{ publicSlug: string; url: string }> {
  let published: { publicSlug: string } | null;

  try {
    published = await publishPageRecord({ pageId: input.pageId, userId: input.userId });
  } catch (error) {
    if (error instanceof PublicSlugUnavailableError) {
      throw new AppError("CONFLICT", "Gagal membuat URL publik yang unik. Coba lagi.");
    }
    throw error;
  }

  if (!published) throw new AppError("NOT_FOUND", "Halaman tidak ditemukan.");

  return { publicSlug: published.publicSlug, url: `/pages/${published.publicSlug}` };
}

export async function unpublishPage(input: { userId: string; pageId: string }): Promise<void> {
  const count = await unpublishPageRecord({ pageId: input.pageId, userId: input.userId });
  if (count === 0) throw new AppError("NOT_FOUND", "Halaman tidak ditemukan.");
}

/**
 * Dokumen publik untuk pengunjung. Konten rusak tidak boleh melempar error ke publik:
 * fallback ke dokumen kosong dengan judul halaman.
 */
export async function getPublishedPageForRender(
  publicSlug: string,
): Promise<{ document: BuilderDocument; title: string } | null> {
  if (!publicSlug) return null;

  const page = await findPublishedPageByPublicSlug(publicSlug);
  if (!page || !page.publicSlug) return null;

  let document: BuilderDocument;
  try {
    document = normalizeDocument(page.content, page.title);
  } catch {
    document = createEmptyDocument(page.title);
  }

  return { document, title: page.title };
}

export async function duplicatePage(input: { userId: string; pageId: string }) {
  const source = await findOwnedPage(input);
  if (!source) throw new AppError("NOT_FOUND", "Halaman tidak ditemukan.");

  const document = normalizeDocument(source.content, source.title);
  const title = `${source.title} (Salinan)`.slice(0, 150);

  return createWithUniqueSlug({ projectId: source.projectId, title, content: document });
}

export async function getPageDocument(input: { userId: string; pageId: string }) {
  const page = await findOwnedPage(input);
  if (!page) throw new AppError("NOT_FOUND", "Halaman tidak ditemukan.");
  return { document: normalizeDocument(page.content, page.title), revision: page.revision };
}

export async function forceSavePageContent(input: {
  userId: string;
  pageId: string;
  content: unknown;
}) {
  assertContentSize(input.content);
  const document = normalizeDocument(input.content);
  const page = await findOwnedPage({ pageId: input.pageId, userId: input.userId });
  if (!page) throw new AppError("NOT_FOUND", "Halaman tidak ditemukan.");

  const count = await updatePageContent({
    pageId: page.id,
    userId: input.userId,
    content: toJson(document),
    baseRevision: page.revision,
  });

  if (count === 0) throw new AppError("REVISION_CONFLICT", "Gagal menimpa halaman. Coba lagi.");

  const updated = await getPageRevision({ pageId: page.id });
  return { revision: updated?.revision ?? page.revision + 1, document };
}

export async function createPageFromContent(input: {
  userId: string;
  projectId: string;
  title: string;
  content: unknown;
}) {
  const project = await findOwnedProject({ projectId: input.projectId, userId: input.userId });
  if (!project) throw new AppError("NOT_FOUND", "Project tidak ditemukan.");

  const document = normalizeDocument(input.content, input.title);
  return createWithUniqueSlug({
    projectId: input.projectId,
    title: `${input.title} (Konflik)`.slice(0, 150),
    content: document,
  });
}

export async function savePageContent(input: {
  userId: string;
  pageId: string;
  content: unknown;
  baseRevision: number;
}) {
  assertContentSize(input.content);
  const document = normalizeDocument(input.content);
  const json = toJson(document);

  const count = await updatePageContent({
    pageId: input.pageId,
    userId: input.userId,
    content: json,
    baseRevision: input.baseRevision,
  });

  if (count === 0) {
    const page = await findOwnedPage({ pageId: input.pageId, userId: input.userId });
    if (!page) throw new AppError("NOT_FOUND", "Halaman tidak ditemukan.");
    throw new AppError("REVISION_CONFLICT", "Halaman diubah di tempat lain.");
  }

  const updated = await getPageRevision({ pageId: input.pageId });
  if (!updated) throw new AppError("NOT_FOUND", "Halaman tidak ditemukan.");

  return { revision: updated.revision, document };
}
