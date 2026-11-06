import { describe, expect, it } from "vitest";
import { extractJsonObject, parseAiOutput } from "@/features/ai/lib/parse-output";

type LooseDocument = {
  version: number;
  rootId: string;
  blocks: Record<string, Record<string, unknown>>;
  fonts: unknown[];
  meta: Record<string, unknown>;
};

function rawDocument(): LooseDocument {
  return {
    version: 1,
    rootId: "root",
    blocks: {
      root: { id: "root", type: "container", props: {}, style: {}, children: ["text1"] },
      text1: {
        id: "text1",
        type: "text",
        props: { text: "Halo dunia" },
        style: {},
        children: [],
      },
    },
    fonts: [],
    meta: { title: "Hasil AI", lang: "id" },
  };
}

describe("ai output parsing", () => {
  it("extracts JSON wrapped in markdown fences and prose", () => {
    const text = `Berikut hasilnya:\n\`\`\`json\n${JSON.stringify(rawDocument())}\n\`\`\``;
    const parsed = parseAiOutput(text);

    expect(parsed.blocks.text1?.props.text).toBe("Halo dunia");
  });

  it("extractJsonObject rejects text without JSON", () => {
    expect(() => extractJsonObject("tidak ada json")).toThrow();
  });

  it("drops unsafe style and sanitizes urls", () => {
    const doc = rawDocument();
    doc.blocks.text1 = {
      ...doc.blocks.text1,
      style: { backgroundColor: "url(javascript:alert(1))", color: "red" },
    };
    doc.blocks.btn = {
      id: "btn",
      type: "button",
      props: { text: "Klik", href: "javascript:alert(1)" },
      style: {},
      children: [],
    };
    doc.blocks.root = { ...doc.blocks.root, children: ["text1", "btn"] };

    const parsed = parseAiOutput(JSON.stringify(doc));

    expect(parsed.blocks.btn?.props.href).toBe("#");
    expect(parsed.blocks.text1?.style.backgroundColor).toBeUndefined();
    expect(parsed.blocks.text1?.style.color).toBe("red");
  });

  it("regenerates invalid block ids and remaps children", () => {
    const doc = rawDocument();
    const textBlock = doc.blocks.text1!;
    doc.blocks["bad id!"] = { ...textBlock, id: "bad id!" };
    delete doc.blocks.text1;
    doc.blocks.root = { ...doc.blocks.root, children: ["bad id!"] };

    const parsed = parseAiOutput(JSON.stringify(doc));
    const remapped = Object.values(parsed.blocks).find((item) => item.type === "text");

    expect(remapped).toBeDefined();
    expect(remapped!.id).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(parsed.blocks[parsed.rootId]?.children).toContain(remapped!.id);
  });

  it("drops fonts with unsafe urls", () => {
    const doc = rawDocument();
    doc.fonts = [
      { id: "bad", family: "Inter", url: "http://example.com/inter.woff2" },
      { id: "ok", family: "Inter", url: "https://example.com/inter.woff2" },
    ];

    const parsed = parseAiOutput(JSON.stringify(doc));
    expect(parsed.fonts).toHaveLength(1);
    expect(parsed.fonts[0]?.url).toContain("https://");
  });
});
