import "server-only";
import { randomUUID } from "node:crypto";
import { isAppError } from "@/lib/errors";
import { AppError } from "@/lib/errors";
import { env } from "@/lib/env";
import { normalizeDocument } from "@/features/editor/schemas/document";
import type { AiMode, GenerateDocumentResult } from "@/features/ai/types";
import { getCatalogVersion } from "@/features/ai/lib/component-catalog";
import { buildMessages, buildRepairMessages, type PromptStyle } from "@/features/ai/lib/prompt-builder";
import { parseAiOutput } from "@/features/ai/lib/parse-output";
import { logAiEvent } from "@/server/ai/ai-logger";
import { callChatCompletion } from "@/server/ai/chat-client";
import { findOwnedPage } from "@/server/repositories/page-repository";
import {
  countGenerationsSince,
  createGenerationRecord,
} from "@/server/repositories/ai-generation-repository";
import { getProviderForGeneration } from "@/server/services/ai-provider-service";

const activeRequests = new Set<string>();

export async function generateDocument(input: {
  userId: string;
  pageId: string;
  mode: AiMode;
  prompt: string;
  style?: PromptStyle;
  providerId?: string | null;
}): Promise<GenerateDocumentResult> {
  const requestId = randomUUID();
  const page = await findOwnedPage({ pageId: input.pageId, userId: input.userId });
  if (!page) throw new AppError("NOT_FOUND", "Halaman tidak ditemukan.");

  const coordKey = `${input.userId}:${input.pageId}`;
  if (activeRequests.has(coordKey)) {
    throw new AppError("CONFLICT", "Permintaan sedang diproses.");
  }
  activeRequests.add(coordKey);

  const startedAt = Date.now();
  let providerId: string | null = null;

  try {
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const recent = await countGenerationsSince(input.userId, since);
    if (recent >= env.AI_RATE_LIMIT_PER_HOUR) {
      throw new AppError("RATE_LIMITED", "Batas generate per jam tercapai. Coba lagi nanti.");
    }

    const { provider, apiKey } = await getProviderForGeneration({
      userId: input.userId,
      providerId: input.providerId,
    });
    providerId = provider.id;

    const document = normalizeDocument(page.content, page.title);
    const messages = buildMessages({
      mode: input.mode,
      prompt: input.prompt,
      document: input.mode === "MODIFY" ? document : undefined,
      style: input.style,
    });

    const catalogVersion = getCatalogVersion();

    let completion = await callChatCompletion({
      baseUrl: provider.baseUrl,
      apiKey,
      model: provider.model,
      messages,
      temperature: provider.temperature,
      maxTokens: provider.maxTokens,
    });

    let parsed;
    try {
      parsed = parseAiOutput(completion.content);
    } catch (firstError) {
      const errors = isAppError(firstError)
        ? [firstError.message, ...Object.values(firstError.fieldErrors ?? {}).flat()]
        : ["struktur tidak valid"];
      completion = await callChatCompletion({
        baseUrl: provider.baseUrl,
        apiKey,
        model: provider.model,
        messages: buildRepairMessages(messages, completion.content, errors),
        temperature: provider.temperature,
        maxTokens: provider.maxTokens,
      });
      parsed = parseAiOutput(completion.content);
    }

    const durationMs = Date.now() - startedAt;

    await createGenerationRecord({
      userId: input.userId,
      pageId: page.id,
      providerId: provider.id,
      mode: input.mode,
      prompt: input.prompt,
      status: "SUCCESS",
      promptTokens: completion.usage.promptTokens ?? null,
      completionTokens: completion.usage.completionTokens ?? null,
      catalogVersion,
      durationMs,
    });

    logAiEvent("ai.request.completed", {
      requestId,
      userId: input.userId,
      providerId: provider.id,
      model: provider.model,
      mode: input.mode,
      status: "SUCCESS",
      durationMs,
      promptTokens: completion.usage.promptTokens,
      completionTokens: completion.usage.completionTokens,
    });

    return {
      document: parsed,
      provider: { id: provider.id, name: provider.name, model: provider.model },
      usage: {
        promptTokens: completion.usage.promptTokens,
        completionTokens: completion.usage.completionTokens,
        durationMs,
      },
      warnings: [],
      catalogVersion,
      baseRevision: page.revision,
    };
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const errorCode = isAppError(error) ? error.code : "INTERNAL";

    await createGenerationRecord({
      userId: input.userId,
      pageId: page.id,
      providerId,
      mode: input.mode,
      prompt: input.prompt,
      status: "FAILED",
      errorCode,
      durationMs,
    }).catch(() => undefined);

    logAiEvent("ai.request.failed", {
      requestId,
      userId: input.userId,
      providerId: providerId ?? undefined,
      mode: input.mode,
      status: "FAILED",
      errorCode,
      durationMs,
    });

    throw error;
  } finally {
    activeRequests.delete(coordKey);
  }
}
