import { describe, expect, it } from "vitest";
import { createEmptyDocument, type BuilderDocument } from "@/features/editor/schemas/document";
import { escapeHtml, renderHtml, renderStyleAttribute } from "@/features/export/render-html";

function docWithText(text: string): BuilderDocument {
  const doc = createEmptyDocument("Judul <Test>");
  doc.blocks.t1 = { id: "t1", type: "text", props: { text }, style: {}, children: [] };
  doc.blocks.root!.children = ["t1"];
  return doc;
}

describe("renderHtml", () => {
  it("renders a complete HTML document", () => {
    const html = renderHtml(createEmptyDocument("Halaman"));

    expect(html).toContain("<!doctype html>");
    expect(html).toContain('<html lang="id">');
    expect(html).toContain("<title>Halaman</title>");
    expect(html).toContain("<style>");
  });

  it("escapes script tags in text", () => {
    const html = renderHtml(docWithText('<script>alert("xss")</script>'));

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes the document title", () => {
    const html = renderHtml(docWithText("halo"));

    expect(html).toContain("Judul &lt;Test&gt;");
  });

  it("replaces unsafe links with a hash", () => {
    const doc = createEmptyDocument("Halaman");
    doc.blocks.btn = {
      id: "btn",
      type: "button",
      props: { text: "Klik", href: "javascript:alert(1)" },
      style: {},
      children: [],
    };
    doc.blocks.root!.children = ["btn"];

    const html = renderHtml(doc);
    expect(html).not.toContain("javascript:");
    expect(html).toContain('href="#"');
  });

  it("drops unsafe style declarations", () => {
    expect(renderStyleAttribute({ color: "red" })).toBe(' style="color:red"');
    expect(renderStyleAttribute({ backgroundColor: "url(javascript:alert(1))" })).toBe("");
    expect(renderStyleAttribute({ color: "red;background:url(x)" })).toBe("");
  });

  it("escapes plain text helper", () => {
    expect(escapeHtml('<a href="x">&</a>')).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;");
  });
});
