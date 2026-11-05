import { z } from "zod";

export const pageIdSchema = z.string().uuid("ID halaman tidak valid.");
export const projectIdSchema = z.string().uuid("ID project tidak valid.");

export const createPageSchema = z.object({
  projectId: projectIdSchema,
  title: z.string().trim().min(1, "Judul wajib diisi.").max(150, "Judul maksimal 150 karakter."),
  templateId: z.string().trim().optional(),
});

export const renamePageSchema = z.object({
  pageId: pageIdSchema,
  title: z.string().trim().min(1, "Judul wajib diisi.").max(150, "Judul maksimal 150 karakter."),
});

export const savePageContentSchema = z.object({
  pageId: pageIdSchema,
  content: z.unknown(),
  baseRevision: z.number().int().min(1),
});

export const versionIdSchema = z.string().uuid("ID versi tidak valid.");
