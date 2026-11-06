import { describe, expect, it } from "vitest";
import {
  buildPublicSlugCandidate,
  MAX_PUBLIC_SLUG_LENGTH,
  withSlugSuffix,
} from "@/features/pages/publish-slug";

describe("buildPublicSlugCandidate", () => {
  it("slugifies the title", () => {
    expect(buildPublicSlugCandidate("Halaman Promo Spesial", "halaman-1")).toBe(
      "halaman-promo-spesial",
    );
  });

  it("removes accents and punctuation", () => {
    expect(buildPublicSlugCandidate("Café Déjà Vu!", "apa-saja")).toBe("cafe-deja-vu");
  });

  it("falls back to the page slug when the title has no usable characters", () => {
    expect(buildPublicSlugCandidate("!!!", "slug-halaman")).toBe("slug-halaman");
    expect(buildPublicSlugCandidate("", "slug-halaman")).toBe("slug-halaman");
  });

  it("falls back to 'halaman' when neither title nor slug is usable", () => {
    expect(buildPublicSlugCandidate("!!!", "???")).toBe("halaman");
    expect(buildPublicSlugCandidate("", "")).toBe("halaman");
  });

  it(`limits the slug to ${MAX_PUBLIC_SLUG_LENGTH} characters without trailing hyphen`, () => {
    const long = `${"a".repeat(90)} ${"b".repeat(40)}`;
    const slug = buildPublicSlugCandidate(long, "abaikan");
    expect(slug.length).toBeLessThanOrEqual(MAX_PUBLIC_SLUG_LENGTH);
    expect(slug.endsWith("-")).toBe(false);
    expect(slug.startsWith("a".repeat(90))).toBe(true);
  });
});

describe("withSlugSuffix", () => {
  it("returns the base slug for attempt 1", () => {
    expect(withSlugSuffix("halaman-promo", 1)).toBe("halaman-promo");
  });

  it("appends a numeric suffix for later attempts", () => {
    expect(withSlugSuffix("halaman-promo", 2)).toBe("halaman-promo-2");
    expect(withSlugSuffix("halaman-promo", 19)).toBe("halaman-promo-19");
  });

  it("trims the base so the suffixed slug stays within the limit", () => {
    const base = "a".repeat(100);
    const slug = withSlugSuffix(base, 3);
    expect(slug.length).toBeLessThanOrEqual(MAX_PUBLIC_SLUG_LENGTH);
    expect(slug.endsWith("-3")).toBe(true);
    expect(slug).toBe(`${"a".repeat(MAX_PUBLIC_SLUG_LENGTH - 2)}-3`);
  });

  it("trims trailing hyphens left over from the cut", () => {
    const base = `${"a".repeat(98)}-b`;
    expect(withSlugSuffix(base, 2)).toBe(`${"a".repeat(98)}-2`);
  });

  it("falls back to 'halaman' for empty bases", () => {
    expect(withSlugSuffix("", 1)).toBe("halaman");
    expect(withSlugSuffix("", 2)).toBe("halaman-2");
  });
});
