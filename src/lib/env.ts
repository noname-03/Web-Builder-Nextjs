import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  SESSION_COOKIE_NAME: z.string().min(1).default("wb_session"),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(7),
  SEED_ADMIN_EMAIL: z.string().min(1).optional(),
  SEED_ADMIN_PASSWORD: z.string().min(1).optional(),
  APP_URL: z.string().min(1).default("http://localhost:3000"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
  throw new Error(`Environment variable tidak valid:\n${details.join("\n")}`);
}

export const env = parsed.data;
