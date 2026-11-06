import "server-only";

type AiLogPayload = {
  requestId: string;
  userId?: string;
  providerId?: string;
  model?: string;
  mode?: string;
  status?: string;
  durationMs?: number;
  errorCode?: string;
  promptTokens?: number;
  completionTokens?: number;
};

export function logAiEvent(event: string, payload: AiLogPayload): void {
  const safe = {
    event,
    requestId: payload.requestId,
    userId: payload.userId,
    providerId: payload.providerId,
    model: payload.model,
    mode: payload.mode,
    status: payload.status,
    durationMs: payload.durationMs,
    errorCode: payload.errorCode,
    promptTokens: payload.promptTokens,
    completionTokens: payload.completionTokens,
  };

  const line = JSON.stringify(safe);

  if (payload.status === "FAILED") {
    console.error(`[ai] ${line}`);
    return;
  }

  console.log(`[ai] ${line}`);
}
