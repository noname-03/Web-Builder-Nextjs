/**
 * Presentational metadata for the curated template gallery.
 *
 * This module is intentionally free of server/database imports so it can be used
 * from both server components (admin table) and client components (create page dialog).
 */

export type TemplateCategory =
  | "SaaS"
  | "Portfolio"
  | "Agency"
  | "Startup"
  | "Blog"
  | "Product"
  | "Event"
  | "Restaurant"
  | "Pricing"
  | "Blank";

export type TemplateThumbnailVariant =
  | "gradient"
  | "image"
  | "editorial"
  | "menu"
  | "pricing"
  | "blank";

export type TemplateMeta = {
  category: TemplateCategory;
  accentColor: string;
  thumbnailVariant: TemplateThumbnailVariant;
  isFeatured: boolean;
  sortOrder: number;
};

/** Fallback used for templates created by admins that are not part of the curated set. */
export const UNKNOWN_TEMPLATE_META: TemplateMeta = {
  category: "Blank",
  accentColor: "#64748b",
  thumbnailVariant: "blank",
  isFeatured: false,
  sortOrder: 999,
};

export const TEMPLATE_META: Record<string, TemplateMeta> = {
  "SaaS Landing": {
    category: "SaaS",
    accentColor: "#1d4ed8",
    thumbnailVariant: "gradient",
    isFeatured: true,
    sortOrder: 1,
  },
  "Portfolio Minimal": {
    category: "Portfolio",
    accentColor: "#0f172a",
    thumbnailVariant: "image",
    isFeatured: true,
    sortOrder: 2,
  },
  "Agency Kreatif": {
    category: "Agency",
    accentColor: "#f97316",
    thumbnailVariant: "image",
    isFeatured: true,
    sortOrder: 3,
  },
  "Startup Launch": {
    category: "Startup",
    accentColor: "#7c3aed",
    thumbnailVariant: "gradient",
    isFeatured: true,
    sortOrder: 4,
  },
  "Personal Blog": {
    category: "Blog",
    accentColor: "#0f766e",
    thumbnailVariant: "editorial",
    isFeatured: false,
    sortOrder: 5,
  },
  "Product Launch": {
    category: "Product",
    accentColor: "#0ea5e9",
    thumbnailVariant: "image",
    isFeatured: false,
    sortOrder: 6,
  },
  "Event Webinar": {
    category: "Event",
    accentColor: "#0284c7",
    thumbnailVariant: "gradient",
    isFeatured: false,
    sortOrder: 7,
  },
  "Restoran Kafe": {
    category: "Restaurant",
    accentColor: "#b45309",
    thumbnailVariant: "menu",
    isFeatured: false,
    sortOrder: 8,
  },
  "Halaman Pricing": {
    category: "Pricing",
    accentColor: "#0f172a",
    thumbnailVariant: "pricing",
    isFeatured: false,
    sortOrder: 9,
  },
  "Halaman Kosong": {
    category: "Blank",
    accentColor: "#64748b",
    thumbnailVariant: "blank",
    isFeatured: false,
    sortOrder: 10,
  },
};

export function getTemplateMeta(name: string): TemplateMeta {
  return TEMPLATE_META[name] ?? UNKNOWN_TEMPLATE_META;
}

/** Names of the curated templates, ordered by their recommended display position. */
export const TEMPLATE_NAMES: string[] = Object.keys(TEMPLATE_META).sort(
  (left, right) => getTemplateMeta(left).sortOrder - getTemplateMeta(right).sortOrder,
);

/** Featured template names, displayed first and ordered by `sortOrder`. */
export const FEATURED_TEMPLATES: string[] = TEMPLATE_NAMES.filter(
  (name) => getTemplateMeta(name).isFeatured,
);
