import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  SESSION_COOKIE_NAME: z.string().min(1).default("wb_session"),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(7),
  SEED_ADMIN_EMAIL: z.string().min(1).optional(),
  SEED_ADMIN_PASSWORD: z.string().min(1).optional(),
  APP_URL: z.string().min(1).default("http://localhost:3000"),
  ENCRYPTION_KEY: z
    .string()
    .min(1, "ENCRYPTION_KEY wajib diisi.")
    .refine((value) => {
      try {
        return Buffer.from(value, "base64").length === 32;
      } catch {
        return false;
      }
    }, "ENCRYPTION_KEY harus base64 dari 32 byte."),
  ENCRYPTION_KEY_VERSION: z.string().min(1).max(10).default("v1"),
  AI_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1000).max(300000).default(60000),
  AI_MAX_PROMPT_CHARS: z.coerce.number().int().min(100).max(20000).default(4000),
  AI_MAX_CONTEXT_CHARS: z.coerce.number().int().min(1000).max(200000).default(24000),
  AI_RATE_LIMIT_PER_HOUR: z.coerce.number().int().min(1).max(1000).default(30),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
  throw new Error(`Environment variable tidak valid:\n${details.join("\n")}`);
}

export const env = parsed.data;
