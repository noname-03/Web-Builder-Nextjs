import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/server/db";

export async function listActiveTemplates() {
  return db.template.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    take: 50,
    select: { id: true, name: true, description: true },
  });
}

export async function listAllTemplates() {
  return db.template.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      description: true,
      isActive: true,
      updatedAt: true,
    },
  });
}

export async function findTemplateById(templateId: string) {
  return db.template.findUnique({
    where: { id: templateId },
    select: { id: true, name: true, content: true, isActive: true },
  });
}

export async function createTemplateRecord(input: {
  name: string;
  description: string | null;
  content: Prisma.InputJsonValue;
  createdById: string;
}) {
  return db.template.create({
    data: {
      name: input.name,
      description: input.description,
      content: input.content,
      createdById: input.createdById,
    },
    select: { id: true },
  });
}

export async function updateTemplateRecord(input: {
  templateId: string;
  name: string;
  description: string | null;
  content: Prisma.InputJsonValue;
}): Promise<number> {
  const result = await db.template.updateMany({
    where: { id: input.templateId },
    data: { name: input.name, description: input.description, content: input.content },
  });
  return result.count;
}

export async function toggleTemplateRecord(input: { templateId: string; isActive: boolean }): Promise<number> {
  const result = await db.template.updateMany({
    where: { id: input.templateId },
    data: { isActive: input.isActive },
  });
  return result.count;
}
