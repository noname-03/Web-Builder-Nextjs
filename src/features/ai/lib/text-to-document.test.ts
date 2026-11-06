import { describe, expect, it } from "vitest";
import { convertTextToDocument, looksLikeRefusal } from "@/features/ai/lib/text-to-document";
import { convertModelOutput, conversionWarning } from "@/features/ai/lib/content-to-document";
import { createEmptyDocument } from "@/features/editor/schemas/document";
import { renderHtml } from "@/features/export/render-html";

describe("text and markdown conversion", () => {
  it("converts markdown headings, lists, images, and links", () => {
    const markdown = `# Kedai Senja

Kopi dan roti setiap hari.

## Menu

- Es Kopi Susu
- Croissant Butter

![Suasana kafe](https://picsum.photos/seed/cafe/800/400)

[Reservasi](https://example.com/reservasi)

> Buka 08.00 sampai 22.00.`;

    const doc = convertTextToDocument(markdown);
    const types = Object.values(doc.blocks).map((block) => block.type);

    expect(types).toContain("heading");
    expect(types).toContain("text");
    expect(types).toContain("image");
    expect(types).toContain("link");
    expect(doc.meta.title).toContain("Kedai Senja");

    const html = renderHtml(doc);
    expect(html).not.toContain("<script");
  });

  it("converts plain prose into a title and text blocks", () => {
    const doc = convertTextToDocument(
      "Landing page kedai kopi\n\nSelamat datang di kedai kami. Nikmati kopi segar setiap hari.\n\nKami buka setiap hari.",
    );
    const headings = Object.values(doc.blocks).filter((block) => block.type === "heading");
    const texts = Object.values(doc.blocks).filter((block) => block.type === "text");

    expect(headings.length).toBeGreaterThanOrEqual(1);
    expect(texts.length).toBeGreaterThanOrEqual(1);
  });

  it("ignores fenced code blocks", () => {
    const doc = convertTextToDocument(
      "# Halaman\n\n```css\nbody { background: url(javascript:alert(1)); }\n```\n\nTeks aman.",
    );
    const html = renderHtml(doc);

    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("alert(1)");
    expect(html).not.toContain("body {");
  });

  it("detects refusal text", () => {
    expect(looksLikeRefusal("Maaf, saya tidak bisa membantu permintaan ini.")).toBe(true);
    expect(looksLikeRefusal("Berikut halaman landing page untuk kedai kopi Anda.")).toBe(false);
  });

  it("rejects empty content", () => {
    expect(() => convertTextToDocument("   \n  ")).toThrow();
  });
});

describe("model output conversion", () => {
  it("prefers JSON documents", () => {
    const result = convertModelOutput(JSON.stringify(createEmptyDocument("Halaman")));

    expect(result.source).toBe("json");
    expect(result.document.meta.title).toBe("Halaman");
  });

  it("converts HTML to html source", () => {
    const result = convertModelOutput("<html><body><h1>Judul</h1><p>Isi</p></body></html>");

    expect(result.source).toBe("html");
    expect(Object.values(result.document.blocks).some((block) => block.type === "heading")).toBe(
      true,
    );
  });

  it("converts markdown to markdown source", () => {
    const result = convertModelOutput("# Judul\n\n- satu\n- dua");

    expect(result.source).toBe("markdown");
    expect(result.document.blocks[result.document.rootId]?.children.length).toBeGreaterThan(0);
  });

  it("converts plain text to text source", () => {
    const result = convertModelOutput("Kedai kami buka setiap hari dari pagi sampai malam.");

    expect(result.source).toBe("text");
  });

  it("rejects refusals with a clear message", () => {
    expect(() => convertModelOutput("Maaf, saya tidak bisa membantu.")).toThrow(/menolak/);
  });

  it("produces warnings for non-JSON sources", () => {
    expect(conversionWarning("html", false)).toContain("HTML");
    expect(conversionWarning("markdown", false)).toContain("Markdown");
    expect(conversionWarning("text", true)).toContain("terpotong");
    expect(conversionWarning("json", false)).toBeNull();
  });
});
