import "server-only";
import { z } from "zod";
import { AppError } from "@/lib/errors";
import { env } from "@/lib/env";
import { getCompletionUrl } from "@/server/ai/base-url";
import type { ChatMessage } from "@/features/ai/types";

const MAX_RESPONSE_BYTES = 1024 * 1024;

const completionResponseSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({ content: z.string().nullable().optional() }),
        finish_reason: z.string().nullable().optional(),
      }),
    )
    .min(1),
  usage: z
    .object({
      prompt_tokens: z.number().optional(),
      completion_tokens: z.number().optional(),
    })
    .optional(),
});

export type ChatCompletionResult = {
  content: string;
  finishReason?: string;
  usage: { promptTokens?: number; completionTokens?: number };
};

type ChatCompletionInput = {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  temperature: number;
  maxTokens: number;
};

function mapStatusError(status: number): AppError {
  if (status === 401 || status === 403) {
    return new AppError("VALIDATION", "API key ditolak provider.");
  }
  if (status === 404) {
    return new AppError("VALIDATION", "Model atau Base URL tidak ditemukan.");
  }
  if (status === 429) {
    return new AppError("RATE_LIMITED", "Provider membatasi permintaan. Coba lagi nanti.");
  }
  if (status >= 500) {
    return new AppError("INTERNAL", "Provider AI sedang bermasalah. Coba lagi.");
  }
  return new AppError("VALIDATION", "Permintaan ke provider AI ditolak.");
}

async function requestOnce(
  input: ChatCompletionInput,
  includeResponseFormat: boolean,
): Promise<{ status: number; body: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.AI_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(getCompletionUrl(input.baseUrl), {
      method: "POST",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.apiKey}`,
      },
      body: JSON.stringify({
        model: input.model,
        messages: input.messages,
        temperature: input.temperature,
        max_tokens: input.maxTokens,
        stream: false,
        ...(includeResponseFormat ? { response_format: { type: "json_object" } } : {}),
      }),
    });

    if (response.status >= 300 && response.status < 400) {
      throw new AppError("VALIDATION", "Provider AI mengembalikan redirect yang tidak diizinkan.");
    }

    const body = await response.text();
    if (body.length > MAX_RESPONSE_BYTES) {
      throw new AppError("INTERNAL", "Respons provider AI terlalu besar.");
    }

    return { status: response.status, body };
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AppError("INTERNAL", "Permintaan ke provider AI melewati batas waktu.");
    }
    throw new AppError("INTERNAL", "Tidak dapat terhubung ke provider AI.");
  } finally {
    clearTimeout(timeout);
  }
}

export async function callChatCompletion(input: ChatCompletionInput): Promise<ChatCompletionResult> {
  let response = await requestOnce(input, true);

  if (
    response.status === 400 &&
    /response_format/i.test(response.body)
  ) {
    response = await requestOnce(input, false);
  }

  if (response.status < 200 || response.status >= 300) {
    throw mapStatusError(response.status);
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(response.body);
  } catch {
    throw new AppError("INTERNAL", "Provider AI mengembalikan respons yang bukan JSON.");
  }

  const parsed = completionResponseSchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new AppError("INTERNAL", "Format respons provider AI tidak dikenali.");
  }

  const content = parsed.data.choices[0]?.message.content;
  if (!content || content.trim() === "") {
    throw new AppError("INTERNAL", "Provider AI tidak mengembalikan konten.");
  }

  const finishReason = parsed.data.choices[0]?.finish_reason ?? undefined;

  return {
    content,
    finishReason,
    usage: {
      promptTokens: parsed.data.usage?.prompt_tokens,
      completionTokens: parsed.data.usage?.completion_tokens,
    },
  };
}
