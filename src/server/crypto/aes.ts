import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const FORMAT_PATTERN = /^[a-z0-9]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/;

export function encryptWithKey(plaintext: string, key: Buffer, version = "v1"): string {
  if (key.length !== 32) throw new Error("Kunci enkripsi harus 32 byte.");

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [version, iv.toString("base64"), tag.toString("base64"), ciphertext.toString("base64")].join(":");
}

export function decryptWithKey(payload: string, key: Buffer): string {
  if (key.length !== 32) throw new Error("Kunci enkripsi harus 32 byte.");
  if (!FORMAT_PATTERN.test(payload)) throw new Error("Format ciphertext tidak dikenal.");

  const [version, ivB64, tagB64, cipherB64] = payload.split(":");
  if (!version || !ivB64 || !tagB64 || !cipherB64) throw new Error("Ciphertext tidak lengkap.");

  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const ciphertext = Buffer.from(cipherB64, "base64");

  if (iv.length !== IV_LENGTH || tag.length !== AUTH_TAG_LENGTH) {
    throw new Error("Ciphertext tidak valid.");
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}

export function randomBase64Key(): string {
  return randomBytes(32).toString("base64");
}
