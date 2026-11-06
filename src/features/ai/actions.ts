"use server";

import type { ActionResult } from "@/lib/result";
import { invalid, toActionError } from "@/server/action-error";
import { requireUser } from "@/server/auth/guards";
import {
  createProvider,
  deleteProvider,
  listProviders,
  setDefaultProvider,
  testProvider,
  updateProvider,
} from "@/server/services/ai-provider-service";
import { generateDocument } from "@/server/services/ai-generation-service";
import {
  deleteGenerationsForUser,
  listRecentGenerations,
} from "@/server/repositories/ai-generation-repository";
import {
  createProviderSchema,
  generateSchema,
  providerIdSchema,
  updateProviderSchema,
} from "@/features/ai/schemas";
import type { AiProviderPublic, AiGenerationHistoryItem, GenerateDocumentResult } from "@/features/ai/types";

export async function listProvidersAction(): Promise<ActionResult<AiProviderPublic[]>> {
  try {
    const user = await requireUser();
    const providers = await listProviders(user.id);
    return { ok: true, data: providers };
  } catch (error) {
    return toActionError<AiProviderPublic[]>(error, "listProvidersAction");
  }
}

export async function saveProviderAction(
  input:
    | {
        providerId?: undefined;
        name: string;
        baseUrl: string;
        apiKey: string;
        model: string;
        temperature: number;
        maxTokens: number;
      }
    | {
        providerId: string;
        name: string;
        baseUrl: string;
        apiKey?: string;
        model: string;
        temperature: number;
        maxTokens: number;
      },
): Promise<ActionResult<AiProviderPublic>> {
  try {
    const user = await requireUser();

    if (input.providerId) {
      const parsed = updateProviderSchema.safeParse(input);
      if (!parsed.success) return invalid(parsed.error);

      await updateProvider({ userId: user.id, ...parsed.data });
      const providers = await listProviders(user.id);
      const updated = providers.find((provider) => provider.id === parsed.data.providerId);
      if (!updated) return { ok: true, data: providers[0]! };
      return { ok: true, data: updated };
    }

    const parsed = createProviderSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const provider = await createProvider({ userId: user.id, ...parsed.data });
    return { ok: true, data: provider };
  } catch (error) {
    return toActionError<AiProviderPublic>(error, "saveProviderAction");
  }
}

export async function deleteProviderAction(providerId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const parsed = providerIdSchema.safeParse(providerId);
    if (!parsed.success) return invalid(parsed.error);

    await deleteProvider({ userId: user.id, providerId: parsed.data });
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error, "deleteProviderAction");
  }
}

export async function setDefaultProviderAction(providerId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const parsed = providerIdSchema.safeParse(providerId);
    if (!parsed.success) return invalid(parsed.error);

    await setDefaultProvider({ userId: user.id, providerId: parsed.data });
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error, "setDefaultProviderAction");
  }
}

export async function testProviderAction(
  providerId: string,
): Promise<ActionResult<{ latencyMs: number }>> {
  try {
    const user = await requireUser();
    const parsed = providerIdSchema.safeParse(providerId);
    if (!parsed.success) return invalid(parsed.error);

    const result = await testProvider({ userId: user.id, providerId: parsed.data });
    return { ok: true, data: result };
  } catch (error) {
    return toActionError<{ latencyMs: number }>(error, "testProviderAction");
  }
}

export async function generateDocumentAction(input: {
  pageId: string;
  prompt: string;
  mode: "GENERATE" | "MODIFY";
  style?: "minimal" | "bold" | "elegan" | "playful";
  providerId?: string;
}): Promise<ActionResult<GenerateDocumentResult>> {
  try {
    const user = await requireUser();
    const parsed = generateSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const result = await generateDocument({
      userId: user.id,
      pageId: parsed.data.pageId,
      prompt: parsed.data.prompt,
      mode: parsed.data.mode,
      style: parsed.data.style,
      providerId: parsed.data.providerId,
    });

    return { ok: true, data: result };
  } catch (error) {
    return toActionError<GenerateDocumentResult>(error, "generateDocumentAction");
  }
}

export async function listAiHistoryAction(): Promise<ActionResult<AiGenerationHistoryItem[]>> {
  try {
    const user = await requireUser();
    const rows = await listRecentGenerations(user.id, 10);

    return {
      ok: true,
      data: rows.map((row) => ({
        id: row.id,
        mode: row.mode,
        status: row.status,
        prompt: row.prompt,
        durationMs: row.durationMs,
        promptTokens: row.promptTokens,
        completionTokens: row.completionTokens,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    return toActionError<AiGenerationHistoryItem[]>(error, "listAiHistoryAction");
  }
}

export async function clearAiHistoryAction(): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await deleteGenerationsForUser(user.id);
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error, "clearAiHistoryAction");
  }
}
