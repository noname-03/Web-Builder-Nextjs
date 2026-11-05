import "server-only";
import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import type { ZodError } from "zod";
import { isAppError } from "@/lib/errors";
import type { ActionResult } from "@/lib/result";

export function invalid<T = void>(error: ZodError): ActionResult<T> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }
  return {
    ok: false,
    error: { code: "VALIDATION", message: "Data yang dikirim tidak valid.", fieldErrors },
  };
}

export function toActionError<T = void>(error: unknown, context: string): ActionResult<T> {
  if (isAppError(error)) {
    return {
      ok: false,
      error: { code: error.code, message: error.message, fieldErrors: error.fieldErrors },
    };
  }

  const errorId = randomUUID();
  console.error(`[${context}] ${errorId}`, error);
  return {
    ok: false,
    error: { code: "INTERNAL", message: `Terjadi kesalahan. Coba lagi. (${errorId.slice(0, 8)})` },
  };
}

export async function getClientMeta(): Promise<{ userAgent: string | null; ipAddress: string | null }> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || headerList.get("x-real-ip") || null;
  return { userAgent: headerList.get("user-agent"), ipAddress };
}

export function safeCallbackUrl(value: unknown): string {
  if (typeof value !== "string") return "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return "/dashboard";
  }
  return value;
}
