import "server-only";
import { Prisma } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { parseDocument } from "@/features/editor/schemas/document";
import {
  createTemplateRecord,
  listActiveTemplates,
  listAllTemplates,
  toggleTemplateRecord,
  updateTemplateRecord,
} from "@/server/repositories/template-repository";

export async function getActiveTemplates() {
  return listActiveTemplates();
}

export async function getAllTemplates() {
  return listAllTemplates();
}

export async function createTemplate(input: {
  adminId: string;
  name: string;
  description?: string;
  content: unknown;
}) {
  const document = parseDocument(input.content);
  return createTemplateRecord({
    name: input.name.trim(),
    description: input.description?.trim() || null,
    content: document as unknown as Prisma.InputJsonValue,
    createdById: input.adminId,
  });
}

export async function updateTemplate(input: {
  templateId: string;
  name: string;
  description?: string;
  content: unknown;
}): Promise<void> {
  const document = parseDocument(input.content);
  const count = await updateTemplateRecord({
    templateId: input.templateId,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    content: document as unknown as Prisma.InputJsonValue,
  });
  if (count === 0) throw new AppError("NOT_FOUND", "Template tidak ditemukan.");
}

export async function toggleTemplate(input: { templateId: string; isActive: boolean }): Promise<void> {
  const count = await toggleTemplateRecord(input);
  if (count === 0) throw new AppError("NOT_FOUND", "Template tidak ditemukan.");
}
