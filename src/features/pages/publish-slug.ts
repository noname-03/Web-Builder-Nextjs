import { slugify } from "@/lib/slug";

export const MAX_PUBLIC_SLUG_LENGTH = 100;
export const FALLBACK_PUBLIC_SLUG = "halaman";
export const MAX_PUBLIC_SLUG_ATTEMPTS = 20;

function hasSlugContent(value: string): boolean {
  const detached = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  return /[a-z0-9]/i.test(detached);
}

function trimSlug(value: string): string {
  return value.slice(0, MAX_PUBLIC_SLUG_LENGTH).replace(/-+$/g, "");
}

/**
 * Slug publik yang stabil untuk sebuah halaman.
 * Judul dipakai lebih dulu; jika judul tidak menghasilkan slug yang berarti,
 * slug internal halaman dipakai; terakhir jatuh ke "halaman".
 */
export function buildPublicSlugCandidate(title: string, pageSlug: string): string {
  const source = hasSlugContent(title) ? title : hasSlugContent(pageSlug) ? pageSlug : "";
  const slug = source.length > 0 ? trimSlug(slugify(source)) : "";
  return slug.length > 0 ? slug : FALLBACK_PUBLIC_SLUG;
}

/**
 * Percobaan ke-1 mengembalikan slug dasar, percobaan berikutnya menambahkan "-N".
 * Panjang total selalu <= 100 karakter.
 */
export function withSlugSuffix(slug: string, attempt: number): string {
  const base = trimSlug(slug) || FALLBACK_PUBLIC_SLUG;
  const safeAttempt = Number.isFinite(attempt) ? Math.max(1, Math.trunc(attempt)) : 1;
  if (safeAttempt <= 1) return base;

  const suffix = `-${safeAttempt}`;
  const trimmedBase = base.slice(0, MAX_PUBLIC_SLUG_LENGTH - suffix.length).replace(/-+$/g, "");
  return `${trimmedBase || FALLBACK_PUBLIC_SLUG}${suffix}`;
}
