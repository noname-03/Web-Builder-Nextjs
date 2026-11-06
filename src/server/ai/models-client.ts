import "server-only";
import { z } from "zod";
import { AppError } from "@/lib/errors";
import { env } from "@/lib/env";
import { getModelsUrl } from "@/server/ai/base-url";
import type { ProviderModelOption } from "@/features/ai/types";

const MAX_RESPONSE_BYTES = 512 * 1024;
const MAX_MODELS = 100;

const modelsResponseSchema = z.object({
  data: z.array(
    z
      .object({
        id: z.string(),
        object: z.string().optional(),
        owned_by: z.string().optional(),
      })
      .passthrough(),
  ),
});

function mapStatusError(status: number): AppError {
  if (status === 401 || status === 403) {
    return new AppError("VALIDATION", "API key ditolak provider.");
  }
  if (status === 404 || status === 405) {
    return new AppError("VALIDATION", "Provider tidak menyediakan daftar model otomatis.");
  }
  if (status === 429) {
    return new AppError("RATE_LIMITED", "Provider membatasi permintaan. Coba lagi nanti.");
  }
  if (status >= 500) {
    return new AppError("INTERNAL", "Provider AI sedang bermasalah. Coba lagi.");
  }
  return new AppError("VALIDATION", "Permintaan daftar model ditolak provider.");
}

export async function listProviderModels(input: {
  baseUrl: string;
  apiKey: string;
}): Promise<ProviderModelOption[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.AI_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(getModelsUrl(input.baseUrl), {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${input.apiKey}` },
    });

    if (response.status >= 300 && response.status < 400) {
      throw new AppError("VALIDATION", "Provider AI mengembalikan redirect yang tidak diizinkan.");
    }

    if (response.status < 200 || response.status >= 300) {
      throw mapStatusError(response.status);
    }

    const body = await response.text();
    if (body.length > MAX_RESPONSE_BYTES) {
      throw new AppError("INTERNAL", "Respons daftar model terlalu besar.");
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(body);
    } catch {
      throw new AppError("INTERNAL", "Provider mengembalikan daftar model yang tidak valid.");
    }

    const parsed = modelsResponseSchema.safeParse(parsedJson);
    if (!parsed.success) {
      throw new AppError("INTERNAL", "Format daftar model provider tidak dikenali.");
    }

    const unique = new Map<string, ProviderModelOption>();

    for (const model of parsed.data.data) {
      const id = model.id.trim();
      if (id === "") continue;
      if (!unique.has(id)) {
        unique.set(id, { id, label: id, ownedBy: model.owned_by });
      }
    }

    return Array.from(unique.values())
      .sort((a, b) => a.id.localeCompare(b.id, undefined, { sensitivity: "base" }))
      .slice(0, MAX_MODELS);
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AppError("INTERNAL", "Permintaan daftar model melewati batas waktu.");
    }
    throw new AppError("INTERNAL", "Tidak dapat terhubung ke provider AI.");
  } finally {
    clearTimeout(timeout);
  }
}
