import { describe, expect, it } from "vitest";
import {
  FEATURED_TEMPLATES,
  TEMPLATE_META,
  TEMPLATE_NAMES,
  UNKNOWN_TEMPLATE_META,
  getTemplateMeta,
} from "@/features/templates/template-meta";
import { SEED_TEMPLATES } from "../../../prisma/seed-templates";

describe("template meta", () => {
  it("has metadata for every seed template", () => {
    for (const template of SEED_TEMPLATES) {
      const meta = TEMPLATE_META[template.name];
      expect(meta, `meta tidak ditemukan untuk "${template.name}"`).toBeDefined();
      expect(meta?.accentColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("keeps at least four featured templates", () => {
    expect(FEATURED_TEMPLATES.length).toBeGreaterThanOrEqual(4);
    for (const name of FEATURED_TEMPLATES) {
      expect(getTemplateMeta(name).isFeatured).toBe(true);
    }
  });

  it("uses unique sort orders", () => {
    const orders = TEMPLATE_NAMES.map((name) => getTemplateMeta(name).sortOrder);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it("sorts featured and all template names by sort order", () => {
    const featuredOrders = FEATURED_TEMPLATES.map((name) => getTemplateMeta(name).sortOrder);
    expect(featuredOrders).toEqual([...featuredOrders].sort((left, right) => left - right));

    const allOrders = TEMPLATE_NAMES.map((name) => getTemplateMeta(name).sortOrder);
    expect(allOrders).toEqual([...allOrders].sort((left, right) => left - right));
    expect(TEMPLATE_NAMES.length).toBeGreaterThanOrEqual(SEED_TEMPLATES.length);
  });

  it("falls back to the unknown metadata for uncatalogued templates", () => {
    const meta = getTemplateMeta("Template Buatan Admin");
    expect(meta).toEqual(UNKNOWN_TEMPLATE_META);
    expect(meta.category).toBe("Blank");
    expect(meta.isFeatured).toBe(false);
    expect(meta.sortOrder).toBe(999);
  });
});
