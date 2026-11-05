import { z } from "zod";
import { AppError } from "@/lib/errors";

export const BLOCK_TYPES = [
  "section",
  "container",
  "columns",
  "column",
  "heading",
  "text",
  "image",
  "button",
  "link",
  "divider",
  "spacer",
  "navbar",
  "hero",
  "footer",
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

export const CONTAINER_BLOCK_TYPES: readonly BlockType[] = ["section", "container", "columns", "column"];

export function isContainerType(type: BlockType): boolean {
  return CONTAINER_BLOCK_TYPES.includes(type);
}

export const STYLE_KEYS = [
  "color",
  "backgroundColor",
  "fontSize",
  "fontWeight",
  "textAlign",
  "padding",
  "margin",
  "borderRadius",
  "border",
  "borderTop",
  "borderBottom",
  "borderLeft",
  "borderRight",
  "width",
  "height",
  "maxWidth",
  "minHeight",
  "lineHeight",
  "textDecoration",
  "fontFamily",
  "backgroundImage",
  "gap",
  "display",
  "flexDirection",
  "justifyContent",
  "alignItems",
] as const;

export type StyleKey = (typeof STYLE_KEYS)[number];
export type BlockStyle = Partial<Record<StyleKey, string>>;

export type Block = {
  id: string;
  type: BlockType;
  props: Record<string, unknown>;
  style: BlockStyle;
  children: string[];
};

export const FONT_WEIGHTS = ["100", "200", "300", "400", "500", "600", "700", "800", "900"] as const;

export type FontDefinition = {
  id: string;
  family: string;
  url: string;
  weight?: (typeof FONT_WEIGHTS)[number];
  style?: "normal" | "italic";
};

export type BuilderDocument = {
  version: 1;
  rootId: string;
  blocks: Record<string, Block>;
  fonts: FontDefinition[];
  meta: { title: string; description?: string; lang: string; fontFamily?: string };
};

export const MAX_BLOCKS = 500;
export const MAX_DEPTH = 12;
export const MAX_CONTENT_BYTES = 1024 * 1024;
export const MAX_TEXT_LENGTH = 5000;
export const MAX_SLUG_LENGTH = 100;

const BLOCK_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const STYLE_VALUE_PATTERN = /^[#a-zA-Z0-9%.,\s()\-/]+$/;
const FORBIDDEN_STYLE_FRAGMENTS = ["url(", "expression(", "javascript:", "@import", "<", ">", "{", "}", ";"];
const FORBIDDEN_BLOCK_PROPS = ["script", "onclick", "onerror", "dangerouslySetInnerHTML"];

const blockIdSchema = z.string().min(1).max(64).regex(BLOCK_ID_PATTERN);
const textSchema = z.string().max(MAX_TEXT_LENGTH);
const urlSchema = z
  .string()
  .max(2048)
  .refine((value) => value === "" || isSafeUrl(value), "URL tidak diizinkan");

export function isSafeUrl(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === "") return true;
  if (trimmed.startsWith("#")) return true;
  if (trimmed.startsWith("//")) return false;
  if (trimmed.startsWith("/")) return true;

  const lower = trimmed.toLowerCase();
  if (FORBIDDEN_BLOCK_PROPS.some((fragment) => lower.includes(fragment))) return false;

  return /^(https?:|mailto:|tel:)/i.test(trimmed);
}

export function isSafeStyleValue(value: string): boolean {
  if (value.length > 100) return false;
  const lower = value.toLowerCase();
  if (FORBIDDEN_STYLE_FRAGMENTS.some((fragment) => lower.includes(fragment))) return false;
  return STYLE_VALUE_PATTERN.test(value);
}

export function isSafeFontFamily(value: string): boolean {
  if (value.length === 0 || value.length > 100) return false;
  if (/url\(|expression\(|javascript:|["'<>{};\\/]/i.test(value)) return false;
  return /^[A-Za-z0-9 ,-]+$/.test(value);
}

export function isSafeFontUrl(value: string): boolean {
  if (!/^https:\/\/[^\s"'()\\]+$/i.test(value)) return false;
  return /\.(woff2|woff|ttf|otf)(\?[^\s"'()\\]*)?$/i.test(value);
}

export function isSafeGradient(value: string): boolean {
  if (value.length === 0 || value.length > 200) return false;
  if (!/^(linear|radial|conic)-gradient\(/i.test(value)) return false;
  if (!/^[a-zA-Z0-9#%.,\s()-]+$/.test(value)) return false;
  if (/url\(|expression\(|javascript:|[@;{}<>"']/i.test(value)) return false;

  let depth = 0;
  for (const char of value) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (depth < 0) return false;
  }
  return depth === 0;
}

export function isSafeBackgroundUrl(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === "") return true;
  if (/["'()\s\\]/.test(trimmed)) return false;
  if (trimmed.startsWith("//")) return false;
  if (trimmed.startsWith("/")) return true;
  return /^https?:\/\//i.test(trimmed);
}

const styleSchema = z
  .record(z.string(), z.string())
  .superRefine((value, ctx) => {
    for (const [key, styleValue] of Object.entries(value)) {
      if (!(STYLE_KEYS as readonly string[]).includes(key)) {
        ctx.addIssue({ code: "custom", message: `Style tidak dikenal: ${key}` });
        continue;
      }

      const valid =
        key === "backgroundImage"
          ? isSafeGradient(styleValue)
          : key === "fontFamily"
            ? isSafeFontFamily(styleValue)
            : isSafeStyleValue(styleValue);

      if (!valid) {
        ctx.addIssue({ code: "custom", message: `Nilai style tidak valid untuk ${key}` });
      }
    }
  });

const navbarItemSchema = z.object({ label: textSchema.max(60), href: urlSchema }).strict();

const backgroundPropsSchema = {
  backgroundImage: z
    .string()
    .max(2048)
    .refine((value) => isSafeBackgroundUrl(value), "URL gambar latar tidak diizinkan")
    .optional(),
  backgroundSize: z.enum(["cover", "contain", "auto"]).optional(),
  backgroundPosition: z.enum(["center", "top", "bottom", "left", "right"]).optional(),
  overlayColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Warna overlay harus format #rrggbb")
    .optional(),
  overlayOpacity: z.number().int().min(0).max(100).optional(),
  minHeight: z
    .string()
    .regex(/^\d{1,4}(px|vh|rem)$/, "Tinggi minimal tidak valid")
    .optional(),
};

const fontSchema = z
  .object({
    id: z.string().min(1).max(40).regex(/^[a-z0-9-]+$/, "ID font tidak valid"),
    family: z.string().min(1).max(60).refine((value) => isSafeFontFamily(value), "Nama font tidak valid"),
    url: z.string().max(2048).refine((value) => isSafeFontUrl(value), "URL font tidak valid"),
    weight: z.enum(FONT_WEIGHTS).optional(),
    style: z.enum(["normal", "italic"]).optional(),
  })
  .strict();

const blockPropsSchemas: Record<BlockType, z.ZodType<Record<string, unknown>>> = {
  section: z.object(backgroundPropsSchema).strict(),
  container: z.object({ maxWidth: z.string().max(20).optional() }).strict(),
  columns: z.object({ columns: z.number().int().min(1).max(4), gap: z.string().max(20) }).strict(),
  column: z.object({}).strict(),
  heading: z.object({ text: textSchema, level: z.number().int().min(1).max(6) }).strict(),
  text: z.object({ text: textSchema }).strict(),
  image: z.object({ src: urlSchema, alt: textSchema.max(200) }).strict(),
  button: z.object({ text: textSchema.max(100), href: urlSchema }).strict(),
  link: z.object({ text: textSchema.max(100), href: urlSchema }).strict(),
  divider: z.object({}).strict(),
  spacer: z.object({ height: z.string().max(20) }).strict(),
  navbar: z
    .object({
      brand: textSchema.max(60),
      items: z.array(navbarItemSchema).max(8),
      brandType: z.enum(["text", "image"]).optional(),
      brandImage: urlSchema.optional(),
      brandImageAlt: textSchema.max(200).optional(),
      brandImageWidth: z
        .string()
        .regex(/^\d{1,4}(px|%|rem)$/, "Lebar logo tidak valid")
        .optional(),
    })
    .strict(),
  hero: z
    .object({
      title: textSchema,
      subtitle: textSchema,
      buttonText: textSchema.max(60),
      buttonHref: urlSchema,
      ...backgroundPropsSchema,
    })
    .strict(),
  footer: z.object({ text: textSchema }).strict(),
};

const blockSchema = z
  .object({
    id: blockIdSchema,
    type: z.enum(BLOCK_TYPES),
    props: z.record(z.string(), z.unknown()),
    style: styleSchema,
    children: z.array(blockIdSchema).max(200),
  })
  .superRefine((value, ctx) => {
    const propsSchema = blockPropsSchemas[value.type];
    const result = propsSchema.safeParse(value.props);
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({
          code: "custom",
          path: ["props", ...issue.path],
          message: issue.message,
        });
      }
    }
  });

export const builderDocumentSchema = z
  .object({
    version: z.literal(1),
    rootId: blockIdSchema,
    blocks: z.record(blockIdSchema, blockSchema).refine(
      (blocks) => Object.keys(blocks).length <= MAX_BLOCKS,
      `Maksimal ${MAX_BLOCKS} blok`,
    ),
    fonts: z.array(fontSchema).max(3, "Maksimal 3 font per halaman").default([]),
    meta: z
      .object({
        title: z.string().max(200),
        description: z.string().max(500).optional(),
        lang: z.string().min(2).max(10),
        fontFamily: z
          .string()
          .max(100)
          .refine((value) => isSafeFontFamily(value), "Font default tidak valid")
          .optional(),
      })
      .strict(),
  })
  .strict();

export function createEmptyDocument(title = "Halaman Baru"): BuilderDocument {
  return {
    version: 1,
    rootId: "root",
    blocks: {
      root: {
        id: "root",
        type: "container",
        props: { maxWidth: "1200px" },
        style: { padding: "16px" },
        children: [],
      },
    },
    fonts: [],
    meta: { title, lang: "id" },
  };
}

export function validateDocumentStructure(doc: BuilderDocument): string[] {
  const errors: string[] = [];
  const { blocks, rootId } = doc;

  if (!blocks[rootId]) {
    errors.push("Blok root tidak ditemukan.");
    return errors;
  }

  if (blocks[rootId]!.type !== "container") {
    errors.push("Blok root harus bertipe container.");
  }

  const parentOf = new Map<string, string>();

  for (const block of Object.values(blocks)) {
    if (block.id !== block.id.trim()) {
      errors.push(`ID blok tidak valid: ${block.id}`);
    }
    if (block.children.length > 0 && !isContainerType(block.type)) {
      errors.push(`Blok ${block.type} tidak boleh memiliki anak.`);
    }
    for (const childId of block.children) {
      const child = blocks[childId];
      if (!child) {
        errors.push(`Anak ${childId} tidak ditemukan pada blok ${block.id}.`);
        continue;
      }
      if (parentOf.has(childId)) {
        errors.push(`Blok ${childId} memiliki lebih dari satu parent.`);
        continue;
      }
      parentOf.set(childId, block.id);

      if (block.type === "columns" && child.type !== "column") {
        errors.push(`Blok columns hanya boleh berisi column (ditemukan ${child.type}).`);
      }
      if (block.type === "column" && (child.type === "column" || child.type === "columns")) {
        errors.push("Blok column tidak boleh berisi column atau columns.");
      }
    }
  }

  for (const block of Object.values(blocks)) {
    if (block.id === rootId) {
      if (parentOf.has(block.id)) errors.push("Blok root tidak boleh memiliki parent.");
      continue;
    }
    if (!parentOf.has(block.id)) {
      errors.push(`Blok ${block.id} tidak terhubung ke root.`);
    }
  }

  for (const [key, block] of Object.entries(blocks)) {
    if (key !== block.id) {
      errors.push(`ID blok ${block.id} tidak cocok dengan key ${key}.`);
    }

    if (block.type === "column") {
      const parentId = parentOf.get(block.id);
      const parent = parentId ? blocks[parentId] : undefined;
      if (!parent || parent.type !== "columns") {
        errors.push("Blok column hanya boleh berada di dalam columns.");
      }
    }
  }

  if (computeDepth(doc) > MAX_DEPTH) {
    errors.push(`Kedalaman dokumen melebihi ${MAX_DEPTH}.`);
  }

  return Array.from(new Set(errors));
}

function computeDepth(doc: BuilderDocument): number {
  const walk = (id: string, depth: number, seen: Set<string>): number => {
    if (seen.has(id) || depth > MAX_DEPTH + 1) return depth;
    const block = doc.blocks[id];
    if (!block) return depth;
    const nextSeen = new Set(seen).add(id);
    let max = depth;
    for (const childId of block.children) {
      max = Math.max(max, walk(childId, depth + 1, nextSeen));
    }
    return max;
  };
  return walk(doc.rootId, 0, new Set());
}

export function parseDocument(raw: unknown): BuilderDocument {
  const result = builderDocumentSchema.safeParse(raw);
  if (!result.success) {
    throw new AppError("VALIDATION", "Konten halaman tidak valid.", {
      content: result.error.issues.slice(0, 5).map((issue) => issue.message),
    });
  }

  const structureErrors = validateDocumentStructure(result.data as BuilderDocument);
  if (structureErrors.length > 0) {
    throw new AppError("VALIDATION", "Struktur halaman tidak valid.", { content: structureErrors.slice(0, 5) });
  }

  return result.data as BuilderDocument;
}

export function normalizeDocument(raw: unknown, title = "Halaman Baru"): BuilderDocument {
  if (raw === null || typeof raw !== "object" || Object.keys(raw as object).length === 0) {
    return createEmptyDocument(title);
  }
  const candidate = raw as Partial<BuilderDocument>;
  if (!candidate.blocks || !candidate.rootId) {
    return createEmptyDocument(title);
  }
  return parseDocument(raw);
}

export function assertContentSize(content: unknown): void {
  const size = new TextEncoder().encode(JSON.stringify(content)).length;
  if (size > MAX_CONTENT_BYTES) {
    throw new AppError("VALIDATION", "Konten melebihi batas 1 MB.");
  }
}

export function isBuilderDocumentValue(raw: unknown): boolean {
  return builderDocumentSchema.safeParse(raw).success;
}
