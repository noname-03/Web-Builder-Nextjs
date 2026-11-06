import { afterEach, describe, expect, it, vi } from "vitest";
import { callChatCompletion } from "@/server/ai/chat-client";

const baseInput = {
  baseUrl: "https://api.example.com/v1",
  apiKey: "sk-test-123456",
  model: "demo-model",
  messages: [{ role: "user" as const, content: "halo" }],
  temperature: 0,
  maxTokens: 10,
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("chat completion client", () => {
  it("returns content and usage", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(200, {
          choices: [{ message: { content: "ok" } }],
          usage: { prompt_tokens: 3, completion_tokens: 4 },
        }),
      ),
    );

    const result = await callChatCompletion(baseInput);

    expect(result.content).toBe("ok");
    expect(result.usage.promptTokens).toBe(3);
    expect(result.usage.completionTokens).toBe(4);
  });

  it("retries once without response_format when provider rejects it", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("response_format is not supported", { status: 400 }))
      .mockResolvedValueOnce(jsonResponse(200, { choices: [{ message: { content: "{}" } }] }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await callChatCompletion(baseInput);

    expect(result.content).toBe("{}");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0]?.[1]?.body)).toContain("response_format");
    expect(String(fetchMock.mock.calls[1]?.[1]?.body)).not.toContain("response_format");
  });

  it("maps auth errors without leaking the key", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("unauthorized", { status: 401 })));

    await expect(callChatCompletion(baseInput)).rejects.toThrow("API key ditolak provider.");
  });

  it("rejects oversized or invalid json responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("not json", { status: 200 })));

    await expect(callChatCompletion(baseInput)).rejects.toThrow("bukan JSON");
  });

  it("rejects redirects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("", { status: 302, headers: { Location: "https://evil.example" } }),
      ),
    );

    await expect(callChatCompletion(baseInput)).rejects.toThrow("redirect");
  });
});
