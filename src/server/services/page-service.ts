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
  getPageRevision,
  listPagesByProject,
  pageSlugExists,
  renamePageRecord,
  softDeletePage,
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

export async function duplicatePage(input: { userId: string; pageId: string }) {
  const source = await findOwnedPage(input);
  if (!source) throw new AppError("NOT_FOUND", "Halaman tidak ditemukan.");

  const document = normalizeDocument(source.content, source.title);
  const title = `${source.title} (Salinan)`.slice(0, 150);

  return createWithUniqueSlug({ projectId: source.projectId, title, content: document });
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
