import { nanoid } from "nanoid";
import { AppError } from "@/lib/errors";
import { BLOCK_DEFINITIONS } from "@/features/editor/blocks/registry";
import {
  BLOCK_TYPES,
  isSafeBackgroundUrl,
  isSafeFontFamily,
  isSafeFontUrl,
  isSafeGradient,
  isSafeStyleValue,
  isSafeUrl,
  MAX_BLOCKS,
  MAX_TEXT_LENGTH,
  parseDocument,
  STYLE_KEYS,
  type Block,
  type BlockStyle,
  type BlockType,
  type BuilderDocument,
  type FontDefinition,
} from "@/features/editor/schemas/document";

const EXTRA_PROP_KEYS: Partial<Record<BlockType, string[]>> = {
  columns: ["columns"],
  navbar: ["items"],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function tryParseJson(value: string): { ok: true; data: unknown } | { ok: false } {
  try {
    return { ok: true, data: JSON.parse(value) };
  } catch {
    return { ok: false };
  }
}

function unwrapNestedJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const nested = tryParseJson(value.trim());
  return nested.ok ? unwrapNestedJson(nested.data) : value;
}

export function extractJsonObject(text: string): unknown {
  const withoutFences = text
    .replace(/```json\s*/gi, "")
    .replace(/```/g, "")
    .trim();

  const direct = tryParseJson(withoutFences);
  if (direct.ok) return unwrapNestedJson(direct.data);

  const start = withoutFences.indexOf("{");
  const end = withoutFences.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new AppError(
      "VALIDATION",
      "AI mengembalikan teks, bukan JSON. Coba prompt yang lebih spesifik.",
    );
  }

  const sliced = withoutFences.slice(start, end + 1);
  const parsed = tryParseJson(sliced);
  if (parsed.ok) return unwrapNestedJson(parsed.data);

  const repaired = tryParseJson(sliced.replace(/,\s*([}\]])/g, "$1"));
  if (repaired.ok) return unwrapNestedJson(repaired.data);

  throw new AppError("VALIDATION", "JSON dari AI tidak dapat dibaca (mungkin terpotong).");
}

const WRAPPER_KEYS = ["document", "page", "data", "result", "output"] as const;

function unwrapDocumentCandidate(raw: unknown): Record<string, unknown> | null {
  const candidate = unwrapNestedJson(raw);
  if (Array.isArray(candidate)) return { blocks: candidate };
  if (!isRecord(candidate)) return null;

  for (const key of WRAPPER_KEYS) {
    const nested = candidate[key];
    if (!isRecord(nested)) continue;
    if (isRecord(nested.blocks) || Array.isArray(nested.blocks)) return nested;
  }

  return candidate;
}

function normalizeBlocksContainer(
  candidate: Record<string, unknown> | null,
): { blocks: Record<string, unknown>; rootId?: string } | null {
  if (!candidate) return null;

  const blocksValue = candidate.blocks;
  const rootId = typeof candidate.rootId === "string" ? candidate.rootId : undefined;

  if (isRecord(blocksValue)) {
    return { blocks: blocksValue, rootId };
  }

  if (Array.isArray(blocksValue)) {
    const blocks: Record<string, unknown> = {};
    blocksValue.forEach((item, index) => {
      if (!isRecord(item) || typeof item.type !== "string") return;
      const id = typeof item.id === "string" && item.id !== "" ? item.id : `block-${index + 1}`;
      blocks[id] = { ...item, id };
    });
    return { blocks, rootId };
  }

  if (Array.isArray(candidate)) {
    return normalizeBlocksContainer({ blocks: candidate });
  }

  return null;
}

function wholeNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

function sanitizeItems(value: unknown): Array<{ label: string; href: string }> {
  if (!Array.isArray(value)) return [];

  return value
    .slice(0, 8)
    .filter(isRecord)
    .map((item) => ({
      label: typeof item.label === "string" ? item.label.slice(0, 60) : "Menu",
      href: typeof item.href === "string" && isSafeUrl(item.href) ? item.href : "#",
    }));
}

function sanitizeProps(type: BlockType, value: unknown): Record<string, unknown> {
  const source = isRecord(value) ? value : {};
  const allowedKeys = new Set<string>([
    ...BLOCK_DEFINITIONS[type].fields.map((field) => field.key),
    ...(EXTRA_PROP_KEYS[type] ?? []),
  ]);
  const props: Record<string, unknown> = {};

  for (const [key, raw] of Object.entries(source)) {
    if (!allowedKeys.has(key)) continue;

    if (key === "items") {
      props.items = sanitizeItems(raw);
      continue;
    }

    if (key === "level") {
      const level = wholeNumber(raw);
      if (level !== null) props.level = Math.min(6, Math.max(1, level));
      continue;
    }

    if (key === "overlayOpacity") {
      const opacity = wholeNumber(raw);
      if (opacity !== null) props.overlayOpacity = Math.min(100, Math.max(0, opacity));
      continue;
    }

    if (typeof raw === "number") {
      props[key] = raw;
      continue;
    }

    if (typeof raw !== "string") continue;
    const text = raw.slice(0, MAX_TEXT_LENGTH);

    if (key === "href" || key === "buttonHref") {
      props[key] = isSafeUrl(text) ? text : "#";
      continue;
    }

    if (key === "src" || key === "brandImage") {
      props[key] = isSafeUrl(text) ? text : "";
      continue;
    }

    if (key === "backgroundImage") {
      props[key] = isSafeBackgroundUrl(text) ? text : "";
      continue;
    }

    props[key] = text;
  }

  return props;
}

function sanitizeStyle(value: unknown): BlockStyle {
  if (!isRecord(value)) return {};
  const style: BlockStyle = {};

  for (const key of STYLE_KEYS) {
    const raw = value[key];
    if (typeof raw !== "string") continue;

    const valid =
      key === "backgroundImage"
        ? isSafeGradient(raw)
        : key === "fontFamily"
          ? isSafeFontFamily(raw)
          : isSafeStyleValue(raw);

    if (valid) style[key] = raw;
  }

  return style;
}

function sanitizeFonts(value: unknown): FontDefinition[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(isRecord)
    .slice(0, 3)
    .map((font, index) => ({
      id: typeof font.id === "string" && /^[a-z0-9-]+$/.test(font.id) ? font.id : `font-${index + 1}`,
      family: typeof font.family === "string" ? font.family.slice(0, 60) : "",
      url: typeof font.url === "string" ? font.url : "",
      weight: typeof font.weight === "string" ? font.weight : undefined,
      style: font.style === "italic" ? ("italic" as const) : ("normal" as const),
    }))
    .filter((font) => isSafeFontFamily(font.family) && isSafeFontUrl(font.url))
    .map((font) => ({
      id: font.id,
      family: font.family,
      url: font.url,
      weight: font.weight as FontDefinition["weight"],
      style: font.style,
    }));
}

export function sanitizeAiDocument(raw: unknown): BuilderDocument {
  const candidate = unwrapDocumentCandidate(raw);
  const normalized = normalizeBlocksContainer(candidate);

  if (!candidate || !normalized || Object.keys(normalized.blocks).length === 0) {
    throw new AppError(
      "VALIDATION",
      "AI tidak mengembalikan struktur dokumen (blok tidak ditemukan). Coba prompt yang lebih spesifik.",
    );
  }

  const idMap = new Map<string, string>();
  const usedIds = new Set<string>();
  const blocks: Record<string, Block> = {};

  for (const [rawId, rawBlock] of Object.entries(normalized.blocks)) {
    if (!isRecord(rawBlock)) continue;
    if (typeof rawBlock.type !== "string") continue;
    if (!(BLOCK_TYPES as readonly string[]).includes(rawBlock.type)) continue;

    let id = /^[A-Za-z0-9_-]{1,64}$/.test(rawId) && !usedIds.has(rawId) ? rawId : nanoid(10);
    while (usedIds.has(id)) id = nanoid(10);
    usedIds.add(id);
    idMap.set(rawId, id);

    const type = rawBlock.type as BlockType;
    const children = Array.isArray(rawBlock.children)
      ? rawBlock.children.filter((child): child is string => typeof child === "string")
      : [];

    blocks[id] = {
      id,
      type,
      props: sanitizeProps(type, rawBlock.props),
      style: sanitizeStyle(rawBlock.style),
      children,
    };
  }

  if (Object.keys(blocks).length === 0) {
    throw new AppError("VALIDATION", "AI tidak menghasilkan blok yang dikenali.");
  }

  for (const block of Object.values(blocks)) {
    block.children = block.children
      .map((child) => idMap.get(child))
      .filter((child): child is string => Boolean(child) && child !== block.id);

    if (block.children.length > 0 && !BLOCK_DEFINITIONS[block.type].isContainer) {
      block.children = [];
    }
  }

  let rootId =
    normalized.rootId && idMap.has(normalized.rootId)
      ? idMap.get(normalized.rootId)!
      : Object.values(blocks).find((block) => block.type === "container")?.id;

  if (!rootId || !blocks[rootId]) {
    rootId = nanoid(10);
    blocks[rootId] = { id: rootId, type: "container", props: { maxWidth: "1200px" }, style: {}, children: [] };
  }

  if (blocks[rootId]?.type !== "container") {
    blocks[rootId] = { ...blocks[rootId]!, type: "container" };
  }

  const childIds = new Set(Object.values(blocks).flatMap((block) => block.children));

  for (const block of Object.values(blocks)) {
    if (block.id === rootId) continue;
    if (childIds.has(block.id)) continue;
    if (block.type === "column" || block.type === "columns") continue;
    blocks[rootId]?.children.push(block.id);
  }

  const ids = Object.keys(blocks);
  if (ids.length > MAX_BLOCKS) {
    for (const id of ids.slice(MAX_BLOCKS)) {
      if (id === rootId) continue;
      delete blocks[id];
    }
    for (const block of Object.values(blocks)) {
      block.children = block.children.filter((child) => Boolean(blocks[child]));
    }
  }

  const meta = isRecord(candidate.meta) ? candidate.meta : {};
  const fontFamily =
    typeof meta.fontFamily === "string" && isSafeFontFamily(meta.fontFamily) ? meta.fontFamily : undefined;

  const document: BuilderDocument = {
    version: 1,
    rootId,
    blocks,
    fonts: sanitizeFonts(candidate.fonts),
    meta: {
      title: typeof meta.title === "string" ? meta.title.slice(0, 200) : "Halaman AI",
      description: typeof meta.description === "string" ? meta.description.slice(0, 500) : undefined,
      lang: typeof meta.lang === "string" && meta.lang.length >= 2 ? meta.lang.slice(0, 10) : "id",
      fontFamily,
    },
  };

  return parseDocument(document);
}

export function parseAiOutput(text: string): BuilderDocument {
  return sanitizeAiDocument(extractJsonObject(text));
}
