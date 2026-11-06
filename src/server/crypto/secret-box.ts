import "server-only";
import { AppError } from "@/lib/errors";
import { env } from "@/lib/env";
import { decryptWithKey, encryptWithKey } from "@/server/crypto/aes";

function getKey(): Buffer {
  const key = Buffer.from(env.ENCRYPTION_KEY, "base64");
  if (key.length !== 32) {
    throw new AppError("INTERNAL", "Kunci enkripsi tidak valid.");
  }
  return key;
}

export function encryptSecret(plaintext: string): string {
  return encryptWithKey(plaintext, getKey(), env.ENCRYPTION_KEY_VERSION);
}

export function decryptSecret(payload: string): string {
  try {
    return decryptWithKey(payload, getKey());
  } catch {
    throw new AppError("INTERNAL", "Konfigurasi provider perlu disimpan ulang.");
  }
}
