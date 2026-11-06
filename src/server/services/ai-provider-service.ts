import "server-only";
import { AppError } from "@/lib/errors";
import { assertSafeBaseUrl } from "@/server/ai/base-url";
import { callChatCompletion } from "@/server/ai/chat-client";
import { decryptSecret, encryptSecret } from "@/server/crypto/secret-box";
import { isUniqueConstraintError } from "@/server/prisma-errors";
import {
  countByUser,
  createProviderRecord,
  deleteProviderRecord,
  findDefaultWithSecret,
  findOwned,
  findOwnedWithSecret,
  listByUser,
  promoteOldestProvider,
  setDefaultProviderRecord,
  updateProviderRecord,
  type AiProviderPublicRow,
  type AiProviderSecretRow,
} from "@/server/repositories/ai-provider-repository";
import type { AiProviderPublic } from "@/features/ai/types";

const MAX_PROVIDERS_PER_USER = 5;
const TEST_LIMIT_PER_HOUR = 10;
const testCalls = new Map<string, number[]>();

export function toPublicProvider(row: AiProviderPublicRow): AiProviderPublic {
  return {
    id: row.id,
    name: row.name,
    baseUrl: row.baseUrl,
    model: row.model,
    temperature: row.temperature,
    maxTokens: row.maxTokens,
    isDefault: row.isDefault,
    keyHint: `••••${row.apiKeyLast4}`,
  };
}

export async function listProviders(userId: string): Promise<AiProviderPublic[]> {
  const rows = await listByUser(userId);
  return rows.map(toPublicProvider);
}

export async function createProvider(input: {
  userId: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}): Promise<AiProviderPublic> {
  const count = await countByUser(input.userId);
  if (count >= MAX_PROVIDERS_PER_USER) {
    throw new AppError("CONFLICT", `Maksimal ${MAX_PROVIDERS_PER_USER} provider per akun.`);
  }

  const safeBaseUrl = assertSafeBaseUrl(input.baseUrl);
  const apiKey = input.apiKey.trim();
  if (apiKey.length < 8) {
    throw new AppError("VALIDATION", "API key terlalu pendek.", { apiKey: ["API key terlalu pendek."] });
  }

  try {
    const row = await createProviderRecord({
      userId: input.userId,
      name: input.name.trim(),
      baseUrl: safeBaseUrl,
      apiKeyEncrypted: encryptSecret(apiKey),
      apiKeyLast4: apiKey.slice(-4),
      model: input.model.trim(),
      temperature: input.temperature,
      maxTokens: input.maxTokens,
      isDefault: count === 0,
    });
    return toPublicProvider(row);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError("CONFLICT", "Nama provider sudah dipakai.", {
        name: ["Nama provider sudah dipakai."],
      });
    }
    throw error;
  }
}

export async function updateProvider(input: {
  userId: string;
  providerId: string;
  name: string;
  baseUrl: string;
  apiKey?: string;
  model: string;
  temperature: number;
  maxTokens: number;
}): Promise<void> {
  const owned = await findOwned({ id: input.providerId, userId: input.userId });
  if (!owned) throw new AppError("NOT_FOUND", "Provider tidak ditemukan.");

  const safeBaseUrl = assertSafeBaseUrl(input.baseUrl);
  const data: Record<string, unknown> = {
    name: input.name.trim(),
    baseUrl: safeBaseUrl,
    model: input.model.trim(),
    temperature: input.temperature,
    maxTokens: input.maxTokens,
  };

  if (input.apiKey && input.apiKey.trim() !== "") {
    const apiKey = input.apiKey.trim();
    if (apiKey.length < 8) {
      throw new AppError("VALIDATION", "API key terlalu pendek.", { apiKey: ["API key terlalu pendek."] });
    }
    data.apiKeyEncrypted = encryptSecret(apiKey);
    data.apiKeyLast4 = apiKey.slice(-4);
  }

  try {
    const count = await updateProviderRecord({
      id: input.providerId,
      userId: input.userId,
      data,
    });
    if (count === 0) throw new AppError("NOT_FOUND", "Provider tidak ditemukan.");
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError("CONFLICT", "Nama provider sudah dipakai.", {
        name: ["Nama provider sudah dipakai."],
      });
    }
    throw error;
  }
}

export async function deleteProvider(input: {
  userId: string;
  providerId: string;
}): Promise<void> {
  const owned = await findOwned({ id: input.providerId, userId: input.userId });
  if (!owned) throw new AppError("NOT_FOUND", "Provider tidak ditemukan.");

  await deleteProviderRecord({ id: input.providerId, userId: input.userId });

  if (owned.isDefault) {
    await promoteOldestProvider(input.userId);
  }
}

export async function setDefaultProvider(input: {
  userId: string;
  providerId: string;
}): Promise<void> {
  const ok = await setDefaultProviderRecord({ id: input.providerId, userId: input.userId });
  if (!ok) throw new AppError("NOT_FOUND", "Provider tidak ditemukan.");
}

function assertTestLimit(userId: string): void {
  const now = Date.now();
  const windowStart = now - 60 * 60 * 1000;
  const calls = (testCalls.get(userId) ?? []).filter((time) => time > windowStart);
  if (calls.length >= TEST_LIMIT_PER_HOUR) {
    throw new AppError("RATE_LIMITED", "Batas tes koneksi tercapai. Coba lagi nanti.");
  }
  calls.push(now);
  testCalls.set(userId, calls);
}

export async function testProvider(input: {
  userId: string;
  providerId: string;
}): Promise<{ latencyMs: number }> {
  assertTestLimit(input.userId);

  const provider = await findOwnedWithSecret({ id: input.providerId, userId: input.userId });
  if (!provider) throw new AppError("NOT_FOUND", "Provider tidak ditemukan.");

  const apiKey = decryptSecret(provider.apiKeyEncrypted);
  const startedAt = Date.now();

  await callChatCompletion({
    baseUrl: provider.baseUrl,
    apiKey,
    model: provider.model,
    messages: [{ role: "user", content: "Balas hanya dengan: ok" }],
    temperature: 0,
    maxTokens: 5,
  });

  return { latencyMs: Date.now() - startedAt };
}

export async function getProviderForGeneration(input: {
  userId: string;
  providerId?: string | null;
}): Promise<{ provider: AiProviderSecretRow; apiKey: string }> {
  const provider = input.providerId
    ? await findOwnedWithSecret({ id: input.providerId, userId: input.userId })
    : await findDefaultWithSecret(input.userId);

  if (!provider) {
    throw new AppError("VALIDATION", "Atur provider AI terlebih dahulu.");
  }

  return { provider, apiKey: decryptSecret(provider.apiKeyEncrypted) };
}
