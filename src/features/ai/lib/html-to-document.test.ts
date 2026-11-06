import { describe, expect, it } from "vitest";
import { convertHtmlToDocument, looksLikeHtml } from "@/features/ai/lib/html-to-document";
import { renderHtml } from "@/features/export/render-html";

const SAMPLE_HTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <title>Kopi Senja</title>
  <style>body { background: url(javascript:alert(1)); }</style>
  <script>alert("xss")</script>
</head>
<body>
  <header>
    <a href="/" class="brand">Kopi Senja</a>
    <nav>
      <a href="#menu">Menu</a>
      <a href="#lokasi">Lokasi</a>
    </nav>
  </header>
  <section class="hero" style="background-image: linear-gradient(135deg,#0f172a,#1d4ed8); padding: 48px">
    <h1>Kedai kopi untuk berlama-lama</h1>
    <p>Buka setiap hari 08.00 sampai 22.00.</p>
    <a href="/menu" class="btn">Lihat Menu</a>
    <img src="https://picsum.photos/seed/kopi/800/500" alt="Secangkir kopi" width="800" />
  </section>
  <section>
    <h2>Menu favorit</h2>
    <ul>
      <li>Es Kopi Susu</li>
      <li>Croissant Butter</li>
    </ul>
  </section>
  <footer>© 2026 Kopi Senja</footer>
</body>
</html>`;

describe("html to builder document", () => {
  it("detects html content", () => {
    expect(looksLikeHtml(SAMPLE_HTML)).toBe(true);
    expect(looksLikeHtml('{"version":1}')).toBe(false);
  });

  it("converts html into supported blocks", () => {
    const doc = convertHtmlToDocument(SAMPLE_HTML);
    const types = Object.values(doc.blocks).map((block) => block.type);

    expect(types).toContain("navbar");
    expect(types).toContain("heading");
    expect(types).toContain("text");
    expect(types).toContain("image");
    expect(types).toContain("button");
    expect(types).toContain("footer");
    expect(doc.meta.title).toBe("Kopi Senja");
    expect(doc.meta.lang).toBe("id");

    const heading = Object.values(doc.blocks).find((block) => block.type === "heading");
    expect(heading?.props.text).toContain("Kedai kopi");

    const button = Object.values(doc.blocks).find((block) => block.type === "button");
    expect(button?.props.href).toBe("/menu");
  });

  it("drops scripts, styles, and unsafe urls", () => {
    const doc = convertHtmlToDocument(SAMPLE_HTML);
    const html = renderHtml(doc);

    expect(html).not.toContain("<script");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("alert(\"xss\")");
  });

  it("keeps safe gradients from inline styles", () => {
    const doc = convertHtmlToDocument(SAMPLE_HTML);
    const section = Object.values(doc.blocks).find(
      (block) => block.type === "section" && block.style.backgroundImage,
    );

    expect(section?.style.backgroundImage).toContain("linear-gradient");
  });

  it("converts list items into text blocks", () => {
    const doc = convertHtmlToDocument(SAMPLE_HTML);
    const texts = Object.values(doc.blocks)
      .filter((block) => block.type === "text")
      .map((block) => String(block.props.text ?? ""));

    expect(texts.some((text) => text.includes("Es Kopi Susu"))).toBe(true);
    expect(texts.some((text) => text.includes("Croissant Butter"))).toBe(true);
  });

  it("rejects non-html input", () => {
    expect(() => convertHtmlToDocument("bukan html")).toThrow();
  });
});
