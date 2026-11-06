import { describe, expect, it } from "vitest";
import { assertSafeBaseUrl, getCompletionUrl } from "@/server/ai/base-url";

describe("base url validation", () => {
  it("normalizes trailing slashes", () => {
    expect(assertSafeBaseUrl("https://api.openai.com/v1/")).toBe("https://api.openai.com/v1");
    expect(getCompletionUrl("https://api.openai.com/v1/")).toBe(
      "https://api.openai.com/v1/chat/completions",
    );
  });

  it("allows local http hosts for local models", () => {
    expect(assertSafeBaseUrl("http://localhost:11434/v1")).toBe("http://localhost:11434/v1");
    expect(assertSafeBaseUrl("http://127.0.0.1:1234/v1")).toBe("http://127.0.0.1:1234/v1");
  });

  it("rejects insecure public hosts", () => {
    expect(() => assertSafeBaseUrl("http://api.openai.com/v1")).toThrow();
  });

  it("rejects private network and metadata addresses", () => {
    expect(() => assertSafeBaseUrl("https://169.254.169.254/v1")).toThrow();
    expect(() => assertSafeBaseUrl("https://10.0.0.5/v1")).toThrow();
    expect(() => assertSafeBaseUrl("https://192.168.1.20/v1")).toThrow();
  });

  it("rejects credentials, query, and hash", () => {
    expect(() => assertSafeBaseUrl("https://user:pass@api.openai.com/v1")).toThrow();
    expect(() => assertSafeBaseUrl("https://api.openai.com/v1?key=1")).toThrow();
    expect(() => assertSafeBaseUrl("https://api.openai.com/v1#x")).toThrow();
  });

  it("rejects unsupported protocols", () => {
    expect(() => assertSafeBaseUrl("ftp://api.openai.com/v1")).toThrow();
    expect(() => assertSafeBaseUrl("not a url")).toThrow();
  });
});
