import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/server/db";

export const aiProviderPublicSelect = {
  id: true,
  name: true,
  baseUrl: true,
  model: true,
  temperature: true,
  maxTokens: true,
  isDefault: true,
  apiKeyLast4: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AiProviderSelect;

export const aiProviderSecretSelect = {
  ...aiProviderPublicSelect,
  apiKeyEncrypted: true,
} satisfies Prisma.AiProviderSelect;

export type AiProviderPublicRow = Prisma.AiProviderGetPayload<{ select: typeof aiProviderPublicSelect }>;
export type AiProviderSecretRow = Prisma.AiProviderGetPayload<{ select: typeof aiProviderSecretSelect }>;

export async function listByUser(userId: string): Promise<AiProviderPublicRow[]> {
  return db.aiProvider.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    select: aiProviderPublicSelect,
  });
}

export async function findOwned(input: { id: string; userId: string }): Promise<AiProviderPublicRow | null> {
  return db.aiProvider.findFirst({
    where: { id: input.id, userId: input.userId },
    select: aiProviderPublicSelect,
  });
}

export async function findOwnedWithSecret(input: {
  id: string;
  userId: string;
}): Promise<AiProviderSecretRow | null> {
  return db.aiProvider.findFirst({
    where: { id: input.id, userId: input.userId },
    select: aiProviderSecretSelect,
  });
}

export async function findDefaultWithSecret(userId: string): Promise<AiProviderSecretRow | null> {
  return db.aiProvider.findFirst({
    where: { userId, isDefault: true },
    select: aiProviderSecretSelect,
  });
}

export async function countByUser(userId: string): Promise<number> {
  return db.aiProvider.count({ where: { userId } });
}

export async function createProviderRecord(input: {
  userId: string;
  name: string;
  baseUrl: string;
  apiKeyEncrypted: string;
  apiKeyLast4: string;
  model: string;
  temperature: number;
  maxTokens: number;
  isDefault: boolean;
}): Promise<AiProviderPublicRow> {
  return db.aiProvider.create({
    data: input,
    select: aiProviderPublicSelect,
  });
}

export async function updateProviderRecord(input: {
  id: string;
  userId: string;
  data: Prisma.AiProviderUpdateManyMutationInput;
}): Promise<number> {
  const result = await db.aiProvider.updateMany({
    where: { id: input.id, userId: input.userId },
    data: input.data,
  });
  return result.count;
}

export async function deleteProviderRecord(input: {
  id: string;
  userId: string;
}): Promise<number> {
  const result = await db.aiProvider.deleteMany({
    where: { id: input.id, userId: input.userId },
  });
  return result.count;
}

export async function setDefaultProviderRecord(input: {
  id: string;
  userId: string;
}): Promise<boolean> {
  return db.$transaction(async (tx) => {
    const owned = await tx.aiProvider.findFirst({
      where: { id: input.id, userId: input.userId },
      select: { id: true },
    });
    if (!owned) return false;

    await tx.aiProvider.updateMany({
      where: { userId: input.userId, isDefault: true },
      data: { isDefault: false },
    });
    await tx.aiProvider.updateMany({
      where: { id: input.id, userId: input.userId },
      data: { isDefault: true },
    });
    return true;
  });
}

export async function promoteOldestProvider(userId: string): Promise<void> {
  const oldest = await db.aiProvider.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!oldest) return;

  await db.aiProvider.updateMany({
    where: { id: oldest.id, userId },
    data: { isDefault: true },
  });
}
