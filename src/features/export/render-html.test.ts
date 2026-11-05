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

  it("renders navbar brand as an image when configured", () => {
    const doc = createEmptyDocument("Halaman");
    doc.blocks.nav = {
      id: "nav",
      type: "navbar",
      props: {
        brand: "Brand",
        items: [{ label: "Beranda", href: "#" }],
        brandType: "image",
        brandImage: "https://example.com/logo.png",
        brandImageAlt: "Logo",
        brandImageWidth: "120px",
      },
      style: {},
      children: [],
    };
    doc.blocks.root!.children = ["nav"];

    const html = renderHtml(doc);
    expect(html).toContain('src="https://example.com/logo.png"');
    expect(html).toContain('alt="Logo"');
    expect(html).toContain("width:120px");
  });

  it("renders section background image with overlay", () => {
    const doc = createEmptyDocument("Halaman");
    doc.blocks.sec = {
      id: "sec",
      type: "section",
      props: {
        backgroundImage: "https://example.com/bg.jpg",
        backgroundSize: "cover",
        backgroundPosition: "center",
        overlayColor: "#000000",
        overlayOpacity: 50,
        minHeight: "320px",
      },
      style: {},
      children: [],
    };
    doc.blocks.root!.children = ["sec"];

    const html = renderHtml(doc);
    expect(html).toContain("background-image:linear-gradient(rgba(0,0,0,0.5),rgba(0,0,0,0.5)),url(&quot;https://example.com/bg.jpg&quot;)");
    expect(html).toContain("background-size:cover");
    expect(html).toContain("min-height:320px");
  });

  it("renders gradient background styles", () => {
    const doc = docWithText("gradien");
    doc.blocks.t1!.style = { backgroundImage: "linear-gradient(135deg,#000000,#ffffff)" };

    const html = renderHtml(doc);
    expect(html).toContain("background-image:linear-gradient(135deg,#000000,#ffffff)");
  });

  it("emits font face rules and default page font", () => {
    const doc = createEmptyDocument("Font");
    doc.fonts = [
      { id: "f1", family: "Inter", url: "https://example.com/inter.woff2", weight: "400" },
    ];
    doc.meta.fontFamily = "Inter";

    const html = renderHtml(doc);
    expect(html).toContain("@font-face");
    expect(html).toContain('font-family:"Inter"');
    expect(html).toContain('format("woff2")');
    expect(html).toContain('body{font-family:"Inter"');
  });

  it("escapes plain text helper", () => {
    expect(escapeHtml('<a href="x">&</a>')).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;");
  });
});
