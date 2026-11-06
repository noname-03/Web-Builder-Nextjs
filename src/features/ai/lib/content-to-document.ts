import { AppError, isAppError } from "@/lib/errors";
import { parseAiOutput } from "@/features/ai/lib/parse-output";
import { convertHtmlToDocument, looksLikeHtml } from "@/features/ai/lib/html-to-document";
import { convertTextToDocument, looksLikeRefusal } from "@/features/ai/lib/text-to-document";
import type { BuilderDocument } from "@/features/editor/schemas/document";

export type ConversionSource = "json" | "html" | "markdown" | "text";

export type ModelOutputConversion = {
  document: BuilderDocument;
  source: ConversionSource;
};

const MARKDOWN_PATTERN = /(^|\n)\s*(#{1,6}\s|[-*+]\s|\d+[.)]\s|!\[|\[[^\]]+\]\([^)]+\)|>\s|```)/;

export function convertModelOutput(raw: string): ModelOutputConversion {
  const content = raw.trim();

  if (!content) {
    throw new AppError("VALIDATION", "AI tidak mengembalikan konten.");
  }

  if (looksLikeRefusal(content)) {
    throw new AppError(
      "VALIDATION",
      "Model menolak permintaan atau tidak menghasilkan halaman. Coba prompt lain atau model lain.",
    );
  }

  let jsonError: unknown = null;

  try {
    return { document: parseAiOutput(content), source: "json" };
  } catch (error) {
    jsonError = error;
  }

  if (looksLikeHtml(content)) {
    try {
      return { document: convertHtmlToDocument(content), source: "html" };
    } catch {
      // fall through to text conversion
    }
  }

  try {
    return {
      document: convertTextToDocument(content),
      source: MARKDOWN_PATTERN.test(content) ? "markdown" : "text",
    };
  } catch {
    // fall through to the structured error below
  }

  if (isAppError(jsonError)) throw jsonError;

  throw new AppError(
    "VALIDATION",
    "AI mengembalikan konten yang tidak dapat diubah menjadi blok. Coba prompt lain.",
  );
}

export function conversionWarning(source: ConversionSource, truncated: boolean): string | null {
  const prefix = truncated ? "Respons AI terpotong; konten yang terbaca tetap diproses. " : "";

  if (source === "html") {
    return `${prefix}Provider mengirim HTML, bukan JSON blok. Konten dikonversi otomatis ke komponen editor; periksa hasilnya sebelum diterapkan.`;
  }
  if (source === "markdown") {
    return `${prefix}Provider mengirim Markdown/teks terstruktur. Konten dikonversi menjadi heading, teks, gambar, dan tautan; rapikan desainnya di editor.`;
  }
  if (source === "text") {
    return `${prefix}Provider mengirim teks biasa, bukan JSON blok. Teks dikonversi menjadi blok heading/teks; tambahkan komponen desain secara manual bila perlu.`;
  }
  if (truncated) {
    return "Respons AI terpotong, tetapi dokumen JSON yang diterima masih valid.";
  }

  return null;
}
