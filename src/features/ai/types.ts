import type { BuilderDocument } from "@/features/editor/schemas/document";

export type AiMode = "GENERATE" | "MODIFY";
export type AiStatus = "SUCCESS" | "FAILED";

export type AiProviderPublic = {
  id: string;
  name: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
  isDefault: boolean;
  keyHint: string;
};

export type AiUsage = {
  promptTokens?: number;
  completionTokens?: number;
  durationMs: number;
};

export type GenerateDocumentResult = {
  document: BuilderDocument;
  provider: { id: string; name: string; model: string };
  usage: AiUsage;
  warnings: string[];
  catalogVersion: string;
  baseRevision: number;
};

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type AiGenerationHistoryItem = {
  id: string;
  mode: AiMode;
  status: AiStatus;
  prompt: string;
  durationMs: number;
  promptTokens: number | null;
  completionTokens: number | null;
  createdAt: string;
};

export type ProviderModelOption = { id: string; label: string; ownedBy?: string };

export type ProviderPreset = {
  id: string;
  label: string;
  baseUrl: string;
  model: string;
  local?: boolean;
};
