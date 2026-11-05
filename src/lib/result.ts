import type { ErrorCode } from "@/lib/errors";

export type ActionError = {
  code: ErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: ActionError };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail<T = void>(error: ActionError): ActionResult<T> {
  return { ok: false, error };
}
