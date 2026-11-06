import { z } from "zod";
import { assertSafeBaseUrl } from "@/server/ai/base-url";

const baseUrlSchema = z
  .string()
  .trim()
  .min(1, "Base URL wajib diisi.")
  .max(300)
  .superRefine((value, ctx) => {
    try {
      assertSafeBaseUrl(value);
    } catch (error) {
      ctx.addIssue({ code: "custom", message: error instanceof Error ? error.message : "Base URL tidak valid." });
    }
  });

export const providerBaseSchema = z.object({
  name: z.string().trim().min(1, "Nama provider wajib diisi.").max(80),
  baseUrl: baseUrlSchema,
  model: z.string().trim().min(1, "Model wajib diisi.").max(120),
  temperature: z.coerce.number().min(0).max(2),
  maxTokens: z.coerce.number().int().min(256).max(32000),
});

export const createProviderSchema = providerBaseSchema.extend({
  apiKey: z.string().trim().min(8, "API key minimal 8 karakter.").max(500),
});

export const updateProviderSchema = providerBaseSchema.extend({
  providerId: z.string().uuid(),
  apiKey: z.string().trim().max(500).optional(),
});

export const providerIdSchema = z.string().uuid("ID provider tidak valid.");

export const generateSchema = z.object({
  pageId: z.string().uuid(),
  prompt: z.string().trim().min(3, "Prompt minimal 3 karakter.").max(20000),
  mode: z.enum(["GENERATE", "MODIFY"]),
  style: z.enum(["minimal", "bold", "elegan", "playful"]).optional(),
  providerId: z.string().uuid().optional(),
});
