import {
  parseDocument,
  type BuilderDocument,
} from "@/features/editor/schemas/document";
import { renderHtml } from "@/features/export/render-html";

/**
 * Quality gate for the curated template library.
 *
 * The checks are intentionally conservative: they never mutate the incoming
 * document and they report every problem instead of throwing, so the test suite
 * (and any future admin UI) can show exactly what is wrong with a template.
 */

export type TemplateQualityIssue = { name: string; message: string };

/** Templates that legitimately start empty and are exempt from content checks. */
const BLANK_TEMPLATE_NAMES = new Set(["Halaman Kosong"]);

const PLACEHOLDER_FRAGMENTS = [
  "lorem ipsum",
  "tulis teks anda",
  "brand anda",
  "nama anda",
  "tuliskan deskripsi",
];

const FORBIDDEN_HTML_FRAGMENTS = ["<script", "onerror=", "javascript:"];

export const LIBRARY_ISSUE_NAME = "Pustaka Template";

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : "Kesalahan tidak diketahui.";
}

function collectStrings(value: unknown, collected: string[] = []): string[] {
  if (typeof value === "string") {
    collected.push(value);
    return collected;
  }

  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, collected);
    return collected;
  }

  if (value !== null && typeof value === "object") {
    for (const item of Object.values(value as Record<string, unknown>)) {
      collectStrings(item, collected);
    }
  }

  return collected;
}

function isBlankDocument(name: string, document: BuilderDocument): boolean {
  if (BLANK_TEMPLATE_NAMES.has(name.trim())) return true;
  return Object.keys(document.blocks).length <= 1;
}

function checkRequiredBlocks(document: BuilderDocument): string[] {
  const blocks = Object.values(document.blocks);

  const hasHeading = blocks.some(
    (block) => block.type === "heading" && (block.props.level === 1 || block.props.level === 2),
  );
  const hasText = blocks.some((block) => block.type === "text");
  const hasAction = blocks.some((block) => block.type === "button" || block.type === "link");

  const issues: string[] = [];
  if (!hasHeading) issues.push("Template butuh minimal satu heading level 1 atau 2.");
  if (!hasText) issues.push("Template butuh minimal satu blok teks.");
  if (!hasAction) issues.push("Template butuh minimal satu tombol atau tautan.");
  return issues;
}

function checkPlaceholderText(document: BuilderDocument): string[] {
  const text = collectStrings(
    Object.values(document.blocks).map((block) => block.props),
  )
    .join("\n")
    .toLowerCase();

  const issues: string[] = [];
  for (const fragment of PLACEHOLDER_FRAGMENTS) {
    if (text.includes(fragment)) {
      issues.push(`Teks placeholder terdeteksi: "${fragment}".`);
    }
  }
  return issues;
}

function checkBackgroundSettings(document: BuilderDocument): string[] {
  const issues: string[] = [];

  for (const block of Object.values(document.blocks)) {
    if (block.type !== "section" && block.type !== "hero") continue;

    const props = block.props as Record<string, unknown>;
    const backgroundImage = props.backgroundImage;
    if (typeof backgroundImage !== "string" || backgroundImage.trim() === "") continue;

    const backgroundSize = props.backgroundSize;
    if (typeof backgroundSize !== "string" || backgroundSize.trim() === "") {
      issues.push(
        `Blok ${block.type} "${block.id}" memakai backgroundImage tanpa backgroundSize.`,
      );
    }

    const overlayOpacity = props.overlayOpacity;
    if (overlayOpacity !== undefined && overlayOpacity !== null) {
      const valid =
        typeof overlayOpacity === "number" &&
        Number.isInteger(overlayOpacity) &&
        overlayOpacity >= 0 &&
        overlayOpacity <= 100;
      if (!valid) {
        issues.push(
          `Blok ${block.type} "${block.id}" memiliki overlayOpacity di luar rentang 0-100.`,
        );
      }
    }
  }

  return issues;
}

function checkRenderedHtml(document: BuilderDocument): string[] {
  let html: string;
  try {
    html = renderHtml(document);
  } catch (error) {
    return [`Gagal merender HTML: ${errorMessage(error)}`];
  }

  const lowered = html.toLowerCase();
  const issues: string[] = [];
  for (const fragment of FORBIDDEN_HTML_FRAGMENTS) {
    if (lowered.includes(fragment)) {
      issues.push(`HTML hasil render mengandung fragmen tidak aman: "${fragment}".`);
    }
  }
  return issues;
}

export function checkTemplateQuality(name: string, document: BuilderDocument): string[] {
  let parsed: BuilderDocument;
  try {
    parsed = parseDocument(document);
  } catch (error) {
    return [`Dokumen tidak lolos validasi skema: ${errorMessage(error)}`];
  }

  const issues: string[] = [];
  if (!isBlankDocument(name, parsed)) {
    issues.push(...checkRequiredBlocks(parsed));
  }

  issues.push(...checkPlaceholderText(parsed));
  issues.push(...checkBackgroundSettings(parsed));
  issues.push(...checkRenderedHtml(parsed));

  return issues;
}

function hasBackgroundImageProp(document: BuilderDocument): boolean {
  return Object.values(document.blocks).some((block) => {
    if (block.type !== "section" && block.type !== "hero") return false;
    const backgroundImage = (block.props as Record<string, unknown>).backgroundImage;
    return typeof backgroundImage === "string" && backgroundImage.trim() !== "";
  });
}

function hasImageBrandNavbar(document: BuilderDocument): boolean {
  return Object.values(document.blocks).some(
    (block) =>
      block.type === "navbar" &&
      (block.props as Record<string, unknown>).brandType === "image",
  );
}

export function checkTemplateLibrary(
  templates: Array<{ name: string; content: BuilderDocument }>,
): TemplateQualityIssue[] {
  const issues: TemplateQualityIssue[] = [];

  for (const template of templates) {
    for (const message of checkTemplateQuality(template.name, template.content)) {
      issues.push({ name: template.name, message });
    }
  }

  const documents = templates.map((template) => template.content);
  const json = JSON.stringify(documents);
  const libraryChecks: Array<{ ok: boolean; message: string }> = [
    {
      ok: /linear-gradient/i.test(json),
      message: "Pustaka template butuh minimal satu dokumen yang memakai gradient (linear-gradient).",
    },
    {
      ok: documents.some((document) => hasBackgroundImageProp(document)),
      message: "Pustaka template butuh minimal satu section/hero dengan props backgroundImage.",
    },
    {
      ok: documents.some((document) => hasImageBrandNavbar(document)),
      message: "Pustaka template butuh minimal satu navbar dengan brandType image.",
    },
    {
      ok: documents.some((document) => Array.isArray(document.fonts) && document.fonts.length > 0),
      message: "Pustaka template butuh minimal satu dokumen yang mendeklarasikan font kustom (fonts.length > 0).",
    },
  ];

  for (const check of libraryChecks) {
    if (!check.ok) issues.push({ name: LIBRARY_ISSUE_NAME, message: check.message });
  }

  return issues;
}
