import { AppError } from "@/lib/errors";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const PRIVATE_HOST_PATTERNS = [
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^127\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^0\./,
  /^\[?::1\]?$/,
  /^\[?fc00:/i,
  /^\[?fe80:/i,
];

export function normalizeBaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, "");
}

export function assertSafeBaseUrl(raw: string): string {
  const trimmed = normalizeBaseUrl(raw);
  let url: URL;

  try {
    url = new URL(trimmed);
  } catch {
    throw new AppError("VALIDATION", "Base URL tidak valid.");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new AppError("VALIDATION", "Base URL harus menggunakan http atau https.");
  }

  if (url.username || url.password) {
    throw new AppError("VALIDATION", "Base URL tidak boleh memuat kredensial.");
  }

  if (url.search || url.hash) {
    throw new AppError("VALIDATION", "Base URL tidak boleh memuat query atau fragment.");
  }

  const hostname = url.hostname.toLowerCase();
  const isLocal = LOCAL_HOSTS.has(hostname);
  const isProduction = process.env.NODE_ENV === "production";

  if (url.protocol === "http:" && !isLocal) {
    throw new AppError("VALIDATION", "Gunakan HTTPS, kecuali untuk model lokal.");
  }

  if (isLocal && isProduction) {
    throw new AppError("VALIDATION", "Host lokal hanya diizinkan pada environment development.");
  }

  if (PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(hostname)) && !isLocal) {
    throw new AppError("VALIDATION", "Alamat jaringan privat tidak diizinkan.");
  }

  return normalizeBaseUrl(url.toString());
}

export function getCompletionUrl(baseUrl: string): string {
  return `${assertSafeBaseUrl(baseUrl)}/chat/completions`;
}
