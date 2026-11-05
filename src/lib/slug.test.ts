import { describe, expect, it } from "vitest";
import { slugify, slugWithSuffix } from "@/lib/slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Halaman Baru Sekali")).toBe("halaman-baru-sekali");
  });

  it("removes accents", () => {
    expect(slugify("Café Déjà Vu")).toBe("cafe-deja-vu");
  });

  it("strips symbols and collapses hyphens", () => {
    expect(slugify("  Halo, Dunia!!  ")).toBe("halo-dunia");
  });

  it("falls back when empty", () => {
    expect(slugify("!!!")).toBe("halaman");
    expect(slugify("")).toBe("halaman");
  });

  it("limits length to 100 characters", () => {
    expect(slugify("a".repeat(150)).length).toBe(100);
  });

  it("adds numeric suffixes", () => {
    expect(slugWithSuffix("halaman", 2)).toBe("halaman-2");
    expect(slugWithSuffix("halaman", 1)).toBe("halaman");
  });
});
