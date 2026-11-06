import { describe, expect, it } from "vitest";
import { decryptWithKey, encryptWithKey, randomBase64Key } from "@/server/crypto/aes";

function keyOf(value = "test-key"): Buffer {
  return Buffer.from(value.padEnd(32, "0").slice(0, 32), "utf8");
}

describe("aes secret box", () => {
  it("round-trips plaintext", () => {
    const payload = encryptWithKey("sk-rahasia-123", keyOf());

    expect(payload.startsWith("v1:")).toBe(true);
    expect(decryptWithKey(payload, keyOf())).toBe("sk-rahasia-123");
  });

  it("produces different ciphertexts for the same plaintext", () => {
    const first = encryptWithKey("sama", keyOf());
    const second = encryptWithKey("sama", keyOf());

    expect(first).not.toBe(second);
  });

  it("rejects tampered payloads", () => {
    const payload = encryptWithKey("rahasia", keyOf());
    const parts = payload.split(":");
    const tampered = [parts[0], parts[1], parts[2], `${parts[3]?.slice(0, -2)}AA`].join(":");

    expect(() => decryptWithKey(tampered, keyOf())).toThrow();
  });

  it("rejects a different key", () => {
    const payload = encryptWithKey("rahasia", keyOf());

    expect(() => decryptWithKey(payload, keyOf("other-key"))).toThrow();
  });

  it("rejects malformed payloads", () => {
    expect(() => decryptWithKey("plain-text", keyOf())).toThrow();
  });

  it("generates 32-byte base64 keys", () => {
    expect(Buffer.from(randomBase64Key(), "base64").length).toBe(32);
  });
});
