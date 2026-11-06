import { createHash } from "node:crypto";
import { BLOCK_DEFINITIONS } from "@/features/editor/blocks/registry";
import {
  BLOCK_TYPES,
  MAX_BLOCKS,
  MAX_DEPTH,
  STYLE_KEYS,
  type BlockType,
} from "@/features/editor/schemas/document";

function allowedChildrenLabel(type: BlockType): string {
  if (type === "columns") return "hanya blok column";
  if (type === "column") return "blok apa pun kecuali column/columns";
  if (type === "section" || type === "container") return "blok layout atau konten (bukan column/columns langsung)";
  return "tidak boleh memiliki anak";
}

function describeFields(type: BlockType): string {
  const fields = BLOCK_DEFINITIONS[type].fields;
  if (fields.length === 0) return "tanpa properti";
  return fields
    .map((field) => {
      if (field.kind === "select") {
        return `${field.key}(${field.options.map((option) => option.value).join("|")})`;
      }
      return `${field.key}(${field.kind})`;
    })
    .join(", ");
}

export type CatalogEntry = {
  type: BlockType;
  label: string;
  isContainer: boolean;
  fields: string;
  allowedChildren: string;
};

export function buildCatalogEntries(): CatalogEntry[] {
  return BLOCK_TYPES.map((type) => ({
    type,
    label: BLOCK_DEFINITIONS[type].label,
    isContainer: BLOCK_DEFINITIONS[type].isContainer,
    fields: describeFields(type),
    allowedChildren: allowedChildrenLabel(type),
  }));
}

export function renderCatalogForPrompt(): string {
  const blocks = buildCatalogEntries()
    .map(
      (entry) =>
        `- ${entry.type} (${entry.isContainer ? "container" : "leaf"}): props {${entry.fields}}; anak: ${entry.allowedChildren}`,
    )
    .join("\n");

  return `Blok tersedia:
${blocks}

Aturan dokumen:
- Semua id blok unik, rootId menunjuk blok bertipe container.
- Setiap blok punya {id,type,props,style,children}; non-container children harus [].
- column hanya boleh berada di dalam columns; columns hanya boleh berisi column.
- Maksimal ${MAX_BLOCKS} blok, kedalaman maksimal ${MAX_DEPTH}.
- style hanya boleh memakai key: ${STYLE_KEYS.join(", ")}.
- backgroundImage pada style hanya menerima linear-gradient/radial-gradient/conic-gradient (tanpa url).
- URL hanya https, http, mailto, tel, "#", atau path "/...".
- fonts maksimal 3, url https berakhiran woff2/woff/ttf/otf, family huruf/angka/spasi/strip.`;
}

export function getCatalogVersion(): string {
  return createHash("sha256").update(renderCatalogForPrompt()).digest("hex").slice(0, 16);
}
