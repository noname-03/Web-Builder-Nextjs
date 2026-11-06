import { describe, expect, it } from "vitest";
import { buildMessages, buildRepairMessages, compactDocumentForPrompt } from "@/features/ai/lib/prompt-builder";
import { buildCatalogEntries, getCatalogVersion, renderCatalogForPrompt } from "@/features/ai/lib/component-catalog";
import { BLOCK_TYPES, createEmptyDocument } from "@/features/editor/schemas/document";

describe("ai component catalog", () => {
  it("includes every block type", () => {
    const entries = buildCatalogEntries();
    const types = entries.map((entry) => entry.type);

    for (const type of BLOCK_TYPES) {
      expect(types).toContain(type);
    }
  });

  it("documents structural rules", () => {
    const catalog = renderCatalogForPrompt();

    expect(catalog).toContain("column hanya boleh berada di dalam columns");
    expect(catalog).toContain("backgroundImage");
  });

  it("exposes a stable catalog version", () => {
    expect(getCatalogVersion()).toMatch(/^[a-f0-9]{16}$/);
  });
});

describe("prompt builder", () => {
  it("builds a generate prompt with the catalog and delimiters", () => {
    const messages = buildMessages({ mode: "GENERATE", prompt: "Landing page kopi" });

    expect(messages).toHaveLength(2);
    expect(messages[0]?.content).toContain("Blok tersedia");
    expect(messages[0]?.content).toContain("KONTRAK WAJIB");
    expect(messages[0]?.content).toContain('"rootId":"root"');
    expect(messages[1]?.content).toContain("<<<PROMPT");
    expect(messages[1]?.content).toContain("Landing page kopi");
  });

  it("includes the document for modify mode", () => {
    const doc = createEmptyDocument("Halaman");
    const messages = buildMessages({ mode: "MODIFY", prompt: "Ganti warna", document: doc });

    expect(messages[1]?.content).toContain("DOKUMEN SAAT INI");
    expect(messages[1]?.content).toContain(doc.rootId);
  });

  it("truncates oversized prompts", () => {
    const messages = buildMessages({ mode: "GENERATE", prompt: "x".repeat(10000) });
    const userContent = messages[1]?.content ?? "";

    expect(userContent.length).toBeLessThan(5000);
  });

  it("compacts oversized documents", () => {
    const doc = createEmptyDocument("Halaman");
    const compact = compactDocumentForPrompt(doc, 40);

    expect(compact.truncated).toBe(true);
    expect(compact.json).toContain("dipotong");
  });

  it("adds a repair instruction", () => {
    const base = buildMessages({ mode: "GENERATE", prompt: "Halaman" });
    const repaired = buildRepairMessages(base, "{invalid}", ["root tidak ada"]);

    expect(repaired.at(-1)?.content).toContain("root tidak ada");
    expect(repaired.at(-1)?.content).toContain('"blocks"');
  });
});
