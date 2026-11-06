import "server-only";
import { AppError } from "@/lib/errors";
import { assertSafeBaseUrl, normalizeBaseUrl } from "@/server/ai/base-url";
import { callChatCompletion } from "@/server/ai/chat-client";
import { listProviderModels } from "@/server/ai/models-client";
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
import type { AiProviderPublic, ProviderModelOption } from "@/features/ai/types";

const MAX_PROVIDERS_PER_USER = 5;
const TEST_LIMIT_PER_HOUR = 10;
const TEST_WINDOW_MS = 60 * 60 * 1000;
const MODEL_CACHE_TTL_MS = 5 * 60 * 1000;
const testCalls = new Map<string, number[]>();
const modelCalls = new Map<string, number[]>();
const modelCache = new Map<string, { expiresAt: number; models: ProviderModelOption[] }>();

function assertHourlyLimit(store: Map<string, number[]>, userId: string, message: string): void {
  const now = Date.now();
  const windowStart = now - TEST_WINDOW_MS;
  const calls = (store.get(userId) ?? []).filter((time) => time > windowStart);
  if (calls.length >= TEST_LIMIT_PER_HOUR) {
    throw new AppError("RATE_LIMITED", message);
  }
  calls.push(now);
  store.set(userId, calls);
}

function modelCacheKey(input: { userId: string; providerId?: string | null; baseUrl: string }): string {
  return `${input.userId}:${input.providerId ?? "draft"}:${normalizeBaseUrl(input.baseUrl)}`;
}

export function invalidateModelCache(userId: string, providerId?: string): void {
  for (const key of modelCache.keys()) {
    if (!key.startsWith(`${userId}:`)) continue;
    if (providerId && !key.startsWith(`${userId}:${providerId}:`)) continue;
    modelCache.delete(key);
  }
}

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
    invalidateModelCache(input.userId);
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
    invalidateModelCache(input.userId, input.providerId);
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
  invalidateModelCache(input.userId, input.providerId);

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
  assertHourlyLimit(testCalls, userId, "Batas tes koneksi tercapai. Coba lagi nanti.");
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

export async function testProviderDraft(input: {
  userId: string;
  baseUrl: string;
  apiKey?: string;
  providerId?: string;
  model: string;
  temperature: number;
  maxTokens: number;
}): Promise<{ latencyMs: number }> {
  assertTestLimit(input.userId);

  const safeBaseUrl = assertSafeBaseUrl(input.baseUrl);
  let apiKey = input.apiKey?.trim() ?? "";

  if (apiKey === "" && input.providerId) {
    const stored = await findOwnedWithSecret({ id: input.providerId, userId: input.userId });
    if (!stored) throw new AppError("NOT_FOUND", "Provider tidak ditemukan.");
    apiKey = decryptSecret(stored.apiKeyEncrypted);
  }

  if (apiKey === "") {
    throw new AppError("VALIDATION", "API key wajib diisi.", { apiKey: ["API key wajib diisi."] });
  }

  const startedAt = Date.now();

  await callChatCompletion({
    baseUrl: safeBaseUrl,
    apiKey,
    model: input.model,
    messages: [{ role: "user", content: "Balas hanya dengan: ok" }],
    temperature: input.temperature,
    maxTokens: 5,
  });

  return { latencyMs: Date.now() - startedAt };
}

export async function listModelsForProvider(input: {
  userId: string;
  providerId?: string;
  baseUrl?: string;
  apiKey?: string;
}): Promise<ProviderModelOption[]> {
  assertHourlyLimit(
    modelCalls,
    input.userId,
    "Batas pengambilan daftar model tercapai. Coba lagi nanti.",
  );

  let baseUrl: string;
  let apiKey: string;
  let providerId: string | null = null;

  if (input.providerId) {
    const stored = await findOwnedWithSecret({ id: input.providerId, userId: input.userId });
    if (!stored) throw new AppError("NOT_FOUND", "Provider tidak ditemukan.");
    providerId = stored.id;
    baseUrl = stored.baseUrl;
    apiKey = decryptSecret(stored.apiKeyEncrypted);
  } else {
    if (!input.baseUrl || !input.apiKey) {
      throw new AppError("VALIDATION", "Base URL dan API key wajib diisi untuk memuat model.");
    }
    baseUrl = assertSafeBaseUrl(input.baseUrl);
    apiKey = input.apiKey.trim();
  }

  const cacheKey = modelCacheKey({ userId: input.userId, providerId, baseUrl });
  const cached = modelCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.models;
  }

  const models = await listProviderModels({ baseUrl, apiKey });
  modelCache.set(cacheKey, { expiresAt: Date.now() + MODEL_CACHE_TTL_MS, models });
  return models;
}
