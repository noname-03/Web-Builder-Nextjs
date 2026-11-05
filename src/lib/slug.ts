const MAX_SLUG_LENGTH = 100;

export function slugify(input: string): string {
  const normalized = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, "");

  return normalized.length > 0 ? normalized : "halaman";
}

export function slugWithSuffix(slug: string, suffix: number): string {
  if (suffix <= 1) return slug;
  const suffixText = `-${suffix}`;
  const base = slug.slice(0, MAX_SLUG_LENGTH - suffixText.length).replace(/-+$/g, "");
  return `${base}${suffixText}`;
}
