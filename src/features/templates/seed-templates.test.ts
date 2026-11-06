import { describe, expect, it } from "vitest";
import { parseDocument } from "@/features/editor/schemas/document";
import { renderHtml } from "@/features/export/render-html";
import { SEED_TEMPLATES } from "../../../prisma/seed-templates";

describe("seed templates", () => {
  it("provides at least eight ready templates", () => {
    expect(SEED_TEMPLATES.length).toBeGreaterThanOrEqual(8);
  });

  it("keeps every template valid against the document schema", () => {
    for (const template of SEED_TEMPLATES) {
      expect(() => parseDocument(template.content)).not.toThrow();
    }
  });

  it("renders every template without scripts or unsafe links", () => {
    for (const template of SEED_TEMPLATES) {
      const document = parseDocument(template.content);
      const html = renderHtml(document);

      expect(html).not.toContain("<script");
      expect(html).not.toContain("javascript:");
      expect(html).not.toContain("onerror=");
    }
  });

  it("uses gradients, backgrounds, logos, and custom fonts in the curated templates", () => {
    const combined = JSON.stringify(SEED_TEMPLATES.map((item) => item.content));
    const rendered = SEED_TEMPLATES.map((item) => renderHtml(parseDocument(item.content))).join("\n");

    expect(combined).toContain("linear-gradient");
    expect(combined).toContain("backgroundImage");
    expect(combined).toContain("brandType");
    expect(rendered).toContain("@font-face");
  });
});
