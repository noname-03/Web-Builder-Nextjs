import { afterEach, describe, expect, it, vi } from "vitest";
import { listProviderModels } from "@/server/ai/models-client";
import { getModelsUrl } from "@/server/ai/base-url";

const baseInput = {
  baseUrl: "https://api.example.com/v1",
  apiKey: "sk-test-123456",
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("provider model discovery", () => {
  it("builds the models URL without double slashes", () => {
    expect(getModelsUrl("https://api.example.com/v1/")).toBe("https://api.example.com/v1/models");
  });

  it("returns unique models sorted case-insensitively", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(200, {
          data: [
            { id: "zeta-model", owned_by: "vendor" },
            { id: "Alpha-model" },
            { id: "zeta-model" },
            { id: "  beta-model  " },
            { id: "   " },
          ],
        }),
      ),
    );

    const models = await listProviderModels(baseInput);

    expect(models.map((model) => model.id)).toEqual(["Alpha-model", "beta-model", "zeta-model"]);
    expect(models[2]?.ownedBy).toBe("vendor");
  });

  it("maps unsupported endpoints to a friendly message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("not found", { status: 404 })));

    await expect(listProviderModels(baseInput)).rejects.toThrow(
      "Provider tidak menyediakan daftar model otomatis.",
    );
  });

  it("maps auth errors without leaking the key", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("unauthorized", { status: 401 })));

    await expect(listProviderModels(baseInput)).rejects.toThrow("API key ditolak provider.");
  });

  it("rejects malformed responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("not json", { status: 200 })));

    await expect(listProviderModels(baseInput)).rejects.toThrow("tidak valid");
  });

  it("rejects redirects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("", { status: 302, headers: { Location: "https://evil.example/models" } }),
      ),
    );

    await expect(listProviderModels(baseInput)).rejects.toThrow("redirect");
  });

  it("limits the number of returned models", async () => {
    const data = Array.from({ length: 150 }, (_, index) => ({ id: `model-${String(index).padStart(3, "0")}` }));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, { data })));

    const models = await listProviderModels(baseInput);
    expect(models).toHaveLength(100);
  });
});
