import { AppError } from "@/lib/errors";
import { collapseText, DocumentBuilder } from "@/features/ai/lib/html-to-document";
import type { BlockStyle, BuilderDocument } from "@/features/editor/schemas/document";

const MAX_PARAGRAPH = 5000;

function stripInlineMarkdown(value: string): string {
  return collapseText(
    value
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      .replace(/(\*|_)(.*?)\1/g, "$2")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/<\/?[a-zA-Z][^>]*>/g, " "),
  );
}

function looksLikeHeading(line: string): boolean {
  return line.length > 0 && line.length <= 80 && !/[.!?]$/.test(line) && !/^[-*+]\s/.test(line);
}

export function convertTextToDocument(raw: string): BuilderDocument {
  const cleaned = raw
    .replace(/```[a-zA-Z]*\s*[\s\S]*?```/g, "\n")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .trim();

  if (!cleaned) {
    throw new AppError("VALIDATION", "AI tidak mengembalikan konten yang bisa dibaca.");
  }

  const doc = new DocumentBuilder();
  const root = doc.root();
  const lines = cleaned.split(/\r?\n/);
  let paragraph: string[] = [];
  let headingCount = 0;
  let firstText = "";
  let added = 0;

  const flush = () => {
    if (paragraph.length === 0) return;
    const text = collapseText(paragraph.join(" ")).slice(0, MAX_PARAGRAPH);
    paragraph = [];
    if (!text) return;
    if (!firstText) firstText = text;
    doc.addText(root, text, { margin: "0 0 16px", color: "#334155" });
    added += 1;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line === "") {
      flush();
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line);
    if (headingMatch) {
      flush();
      const level = Math.min(6, headingMatch[1]!.length);
      const text = stripInlineMarkdown(headingMatch[2] ?? "");
      if (text) {
        doc.addHeading(root, text, level, {
          margin: level === 1 ? "0 0 16px" : "8px 0 8px",
          color: "#0f172a",
        });
        headingCount += 1;
        added += 1;
        if (!firstText && level === 1) firstText = text;
      }
      continue;
    }

    if (/^([-*_])\1{2,}$/.test(line)) {
      flush();
      doc.addDivider(root);
      added += 1;
      continue;
    }

    const imageMatch = /^!\[([^\]]*)\]\(([^)\s]+)\)/.exec(line);
    if (imageMatch) {
      flush();
      doc.addImage(root, imageMatch[2] ?? "", imageMatch[1] ?? "", {
        borderRadius: "8px",
        margin: "0 0 16px",
      });
      added += 1;
      continue;
    }

    const linkMatch = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(line);
    if (linkMatch) {
      flush();
      doc.addLink(root, stripInlineMarkdown(linkMatch[1] ?? ""), linkMatch[2] ?? "#", false, {});
      added += 1;
      continue;
    }

    const listMatch = /^([-*+]|\d+[.)])\s+(.+)$/.exec(line);
    if (listMatch) {
      flush();
      const text = stripInlineMarkdown(listMatch[2] ?? "");
      if (text) {
        doc.addText(root, `• ${text}`, { margin: "0 0 6px", color: "#334155" });
        added += 1;
      }
      continue;
    }

    if (/^>\s?/.test(line)) {
      flush();
      const text = stripInlineMarkdown(line.replace(/^>\s?/, ""));
      if (text) {
        doc.addText(root, text, {
          margin: "0 0 16px",
          padding: "8px 12px",
          borderLeft: "3px solid #94a3b8",
          color: "#475569",
        } as BlockStyle);
        added += 1;
      }
      continue;
    }

    const text = stripInlineMarkdown(line);
    if (text) {
      if (
        paragraph.length === 0 &&
        headingCount === 0 &&
        added === 0 &&
        looksLikeHeading(text) &&
        text.length <= 100
      ) {
        doc.addHeading(root, text, 1, { margin: "0 0 16px", color: "#0f172a" });
        headingCount += 1;
        added += 1;
        if (!firstText) firstText = text;
        continue;
      }
      paragraph.push(text);
    }
  }

  flush();

  if (added === 0) {
    throw new AppError("VALIDATION", "AI tidak mengembalikan konten yang bisa dibaca.");
  }

  const title = (firstText || "Halaman AI").slice(0, 120);
  return doc.build({ title, lang: "id" });
}

const REFUSAL_PATTERNS = [
  /maaf,?\s*(saya|aku)\s+(tidak|belum)\s+(bisa|dapat)/i,
  /saya tidak dapat membantu/i,
  /sebagai (sebuah )?(ai|model bahasa)/i,
  /i(?:'m| am) sorry,?\s*(?:but\s+)?i\s+(?:can(?:not|'t)|am unable)/i,
  /i can(?:not|'t) help with that/i,
];

export function looksLikeRefusal(content: string): boolean {
  const head = content.slice(0, 600);
  return content.length < 2500 && REFUSAL_PATTERNS.some((pattern) => pattern.test(head));
}
