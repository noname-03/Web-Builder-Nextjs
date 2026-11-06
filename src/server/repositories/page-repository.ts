import "server-only";
import { Prisma } from "@prisma/client";
import {
  buildPublicSlugCandidate,
  MAX_PUBLIC_SLUG_ATTEMPTS,
  withSlugSuffix,
} from "@/features/pages/publish-slug";
import { db } from "@/server/db";
import { isUniqueConstraintError } from "@/server/prisma-errors";

export class PublicSlugUnavailableError extends Error {
  constructor() {
    super("PUBLIC_SLUG_UNAVAILABLE");
    this.name = "PublicSlugUnavailableError";
  }
}

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
      isPublished: true,
      publicSlug: true,
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

const OWNED_PAGE_WHERE = (input: { pageId: string; userId: string }) => ({
  id: input.pageId,
  deletedAt: null,
  project: { userId: input.userId, deletedAt: null },
});

/**
 * Halaman yang bisa diakses publik. Draft / halaman terhapus / project terhapus
 * tidak pernah dikembalikan agar keberadaannya tidak bocor.
 */
export async function findPublishedPageByPublicSlug(publicSlug: string) {
  return db.page.findFirst({
    where: {
      publicSlug,
      isPublished: true,
      deletedAt: null,
      project: { deletedAt: null },
    },
    select: { id: true, title: true, content: true, publicSlug: true },
  });
}

/**
 * Publikasikan halaman milik user.
 * - publicSlug lama dipertahankan bila sudah ada (republish memakai URL yang sama)
 * - slug publik baru dibuat unik dalam transaksi, P2002 dicoba ulang dengan suffix berikutnya
 * Mengembalikan null bila halaman tidak ditemukan / bukan milik user.
 */
export async function publishPageRecord(input: {
  pageId: string;
  userId: string;
}): Promise<{ publicSlug: string } | null> {
  const initial = await db.page.findFirst({
    where: OWNED_PAGE_WHERE(input),
    select: { id: true, title: true, slug: true, publicSlug: true },
  });
  if (!initial) return null;

  if (initial.publicSlug) {
    await db.page.update({
      where: { id: initial.id },
      data: { isPublished: true, publishedAt: new Date() },
    });
    return { publicSlug: initial.publicSlug };
  }

  const baseSlug = buildPublicSlugCandidate(initial.title, initial.slug);

  for (let attempt = 1; attempt <= MAX_PUBLIC_SLUG_ATTEMPTS; attempt++) {
    const candidate = withSlugSuffix(baseSlug, attempt);

    try {
      const result = await db.$transaction(async (tx) => {
        const page = await tx.page.findFirst({
          where: OWNED_PAGE_WHERE(input),
          select: { id: true, publicSlug: true },
        });
        if (!page) return { owned: false, publicSlug: null } as const;

        if (page.publicSlug) {
          await tx.page.update({
            where: { id: page.id },
            data: { isPublished: true, publishedAt: new Date() },
          });
          return { owned: true, publicSlug: page.publicSlug } as const;
        }

        const taken = await tx.page.findFirst({
          where: { publicSlug: candidate },
          select: { id: true },
        });
        if (taken) return { owned: true, publicSlug: null } as const;

        await tx.page.update({
          where: { id: page.id },
          data: { isPublished: true, publishedAt: new Date(), publicSlug: candidate },
        });
        return { owned: true, publicSlug: candidate } as const;
      });

      if (!result.owned) return null;
      if (result.publicSlug) return { publicSlug: result.publicSlug };
    } catch (error) {
      if (isUniqueConstraintError(error)) continue;
      throw error;
    }
  }

  throw new PublicSlugUnavailableError();
}

/**
 * Batalkan publikasi. publicSlug tetap disimpan supaya republish memakai URL yang sama.
 */
export async function unpublishPageRecord(input: {
  pageId: string;
  userId: string;
}): Promise<number> {
  const result = await db.page.updateMany({
    where: OWNED_PAGE_WHERE(input),
    data: { isPublished: false, publishedAt: null },
  });
  return result.count;
}
