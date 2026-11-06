import { nanoid } from "nanoid";
import { AppError } from "@/lib/errors";
import {
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
} from "@/features/editor/schemas/document";

type HtmlNode = { tag: string; attrs: Record<string, string>; children: Array<HtmlNode | string> };

const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const DROP_TAGS = new Set([
  "head",
  "script",
  "style",
  "noscript",
  "iframe",
  "object",
  "embed",
  "svg",
  "canvas",
  "template",
  "meta",
  "link",
  "input",
  "select",
  "textarea",
]);

const CONTAINER_TAGS = new Set([
  "body",
  "main",
  "article",
  "aside",
  "div",
  "figure",
  "form",
  "table",
  "tbody",
  "thead",
  "tr",
  "td",
  "th",
  "blockquote",
  "dl",
  "dt",
  "dd",
]);

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  "#39": "'",
  "#x27": "'",
};

function decodeEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    const key = entity.toLowerCase();
    if (ENTITIES[key]) return ENTITIES[key]!;
    if (key.startsWith("#x")) {
      const code = Number.parseInt(key.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    if (key.startsWith("#")) {
      const code = Number.parseInt(key.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return match;
  });
}

export function collapseText(value: string): string {
  return decodeEntities(value).replace(/\s+/g, " ").trim();
}

function findTagEnd(html: string, start: number): number {
  let quote: string | null = null;
  for (let index = start; index < html.length; index++) {
    const char = html[index];
    if (quote) {
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === ">") return index;
  }
  return -1;
}

function parseAttrs(source: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const pattern = /([a-zA-Z_:][\w:.-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

  for (const match of source.matchAll(pattern)) {
    const name = match[1]?.toLowerCase();
    if (!name) continue;
    attrs[name] = match[2] ?? match[3] ?? match[4] ?? "";
  }

  return attrs;
}

function parseHtml(html: string): HtmlNode {
  const root: HtmlNode = { tag: "#root", attrs: {}, children: [] };
  const stack: HtmlNode[] = [root];
  let index = 0;

  const pushText = (text: string) => {
    if (text === "") return;
    stack[stack.length - 1]?.children.push(text);
  };

  while (index < html.length) {
    const lt = html.indexOf("<", index);
    if (lt === -1) {
      pushText(html.slice(index));
      break;
    }
    if (lt > index) pushText(html.slice(index, lt));

    if (html.startsWith("<!--", lt)) {
      const end = html.indexOf("-->", lt + 4);
      index = end === -1 ? html.length : end + 3;
      continue;
    }

    const gt = findTagEnd(html, lt + 1);
    if (gt === -1) {
      pushText(html.slice(lt));
      break;
    }

    const raw = html.slice(lt + 1, gt).trim();
    if (raw === "") {
      index = gt + 1;
      continue;
    }

    if (raw.startsWith("/")) {
      const tag = raw.slice(1).trim().toLowerCase();
      const matchIndex = stack.findLastIndex((node) => node.tag === tag);
      if (matchIndex > 0) stack.length = matchIndex;
      index = gt + 1;
      continue;
    }

    if (raw.startsWith("!") || raw.startsWith("?")) {
      index = gt + 1;
      continue;
    }

    const selfClosing = raw.endsWith("/");
    const content = selfClosing ? raw.slice(0, -1).trim() : raw;
    const space = content.search(/\s/);
    const tag = (space === -1 ? content : content.slice(0, space)).toLowerCase();
    const attrs = parseAttrs(space === -1 ? "" : content.slice(space));

    if (DROP_TAGS.has(tag)) {
      if (VOID_TAGS.has(tag) || selfClosing) {
        index = gt + 1;
        continue;
      }
      const closeTag = `</${tag}`;
      const closeIndex = html.toLowerCase().indexOf(closeTag, gt + 1);
      if (closeIndex === -1) {
        index = gt + 1;
        continue;
      }
      const closeEnd = html.indexOf(">", closeIndex);
      index = closeEnd === -1 ? html.length : closeEnd + 1;
      continue;
    }

    const node: HtmlNode = { tag, attrs, children: [] };
    stack[stack.length - 1]?.children.push(node);

    if (!selfClosing && !VOID_TAGS.has(tag)) {
      stack.push(node);
    }

    index = gt + 1;
  }

  return root;
}

function textContent(node: HtmlNode): string {
  const parts: string[] = [];

  const visit = (current: HtmlNode) => {
    for (const child of current.children) {
      if (typeof child === "string") {
        parts.push(child);
        continue;
      }
      if (child.tag === "br") {
        parts.push(" ");
        continue;
      }
      visit(child);
    }
  };

  visit(node);
  return collapseText(parts.join(" ")).slice(0, MAX_TEXT_LENGTH);
}

function styleFromAttrs(attrs: Record<string, string>): BlockStyle {
  const style: BlockStyle = {};
  const raw = attrs.style;
  if (!raw) return style;

  for (const declaration of raw.split(";")) {
    const separator = declaration.indexOf(":");
    if (separator === -1) continue;
    const property = declaration.slice(0, separator).trim();
    const value = declaration.slice(separator + 1).trim();
    if (!property || !value) continue;

    const key = property.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
    if (!(STYLE_KEYS as readonly string[]).includes(key)) continue;

    const valid =
      key === "backgroundImage"
        ? isSafeGradient(value)
        : key === "fontFamily"
          ? isSafeStyleValue(value)
          : isSafeStyleValue(value);

    if (valid) style[key as keyof BlockStyle] = value;
  }

  return style;
}

function safeUrl(value: string | undefined): string {
  if (!value) return "";
  return isSafeUrl(value.trim()) ? value.trim() : "";
}

export class DocumentBuilder {
  private blocks: Record<string, Block> = {};
  private rootId: string;
  private count = 0;

  constructor() {
    this.rootId = nanoid(10);
    this.blocks[this.rootId] = {
      id: this.rootId,
      type: "container",
      props: { maxWidth: "1200px" },
      style: { padding: "16px" },
      children: [],
    };
  }

  root(): string {
    return this.rootId;
  }

  private addBlock(parentId: string, type: BlockType, props: Record<string, unknown>, style: BlockStyle): string {
    const id = nanoid(10);
    this.blocks[id] = { id, type, props, style, children: [] };
    this.blocks[parentId]?.children.push(id);
    this.count += 1;
    return id;
  }

  addHeading(parentId: string, text: string, level: number, style: BlockStyle): void {
    if (!text) return;
    this.addBlock(parentId, "heading", { text: text.slice(0, MAX_TEXT_LENGTH), level }, style);
  }

  addText(parentId: string, text: string, style: BlockStyle): void {
    if (!text) return;
    this.addBlock(parentId, "text", { text: text.slice(0, MAX_TEXT_LENGTH) }, style);
  }

  addImage(parentId: string, src: string, alt: string, style: BlockStyle): void {
    if (!src) return;
    this.addBlock(parentId, "image", { src, alt: alt.slice(0, 200) }, style);
  }

  addLink(parentId: string, text: string, href: string, isButton: boolean, style: BlockStyle): void {
    if (!text) return;
    this.addBlock(parentId, isButton ? "button" : "link", { text: text.slice(0, 100), href: href || "#" }, style);
  }

  addDivider(parentId: string): void {
    this.addBlock(parentId, "divider", {}, { margin: "16px 0", border: "1px solid #e5e7eb" });
  }

  addNavbar(parentId: string, brand: string, items: Array<{ label: string; href: string }>, style: BlockStyle): void {
    this.addBlock(
      parentId,
      "navbar",
      { brand: brand.slice(0, 60) || "Menu", items: items.slice(0, 8) },
      style,
    );
  }

  addFooter(parentId: string, text: string, style: BlockStyle): void {
    this.addBlock(parentId, "footer", { text: text.slice(0, MAX_TEXT_LENGTH) || "© 2026" }, style);
  }

  addContainer(parentId: string, type: "container" | "section", style: BlockStyle): string {
    return this.addBlock(parentId, type, {}, style);
  }

  removeIfEmpty(id: string): void {
    const block = this.blocks[id];
    if (!block || block.children.length > 0) return;
    delete this.blocks[id];
    for (const candidate of Object.values(this.blocks)) {
      candidate.children = candidate.children.filter((child) => child !== id);
    }
    this.count = Math.max(0, this.count - 1);
  }

  isFull(): boolean {
    return this.count >= MAX_BLOCKS - 1;
  }

  hasChildren(id: string): boolean {
    return (this.blocks[id]?.children.length ?? 0) > 0;
  }

  build(meta: { title: string; lang: string }): BuilderDocument {
    return {
      version: 1,
      rootId: this.rootId,
      blocks: this.blocks,
      fonts: [],
      meta,
    };
  }
}

function collectLinks(node: HtmlNode, limit = 8): Array<{ label: string; href: string }> {
  const links: Array<{ label: string; href: string }> = [];

  const visit = (current: HtmlNode) => {
    for (const child of current.children) {
      if (typeof child === "string") continue;
      if (child.tag === "a") {
        const label = textContent(child);
        if (label) links.push({ label: label.slice(0, 60), href: safeUrl(child.attrs.href) || "#" });
        if (links.length >= limit) return;
      }
      visit(child);
      if (links.length >= limit) return;
    }
  };

  visit(node);
  return links;
}

function containsTag(node: HtmlNode, tags: Set<string>, depth = 0): boolean {
  if (depth > 6) return false;
  for (const child of node.children) {
    if (typeof child === "string") continue;
    if (tags.has(child.tag)) return true;
    if (containsTag(child, tags, depth + 1)) return true;
  }
  return false;
}

function mapNode(node: HtmlNode, doc: DocumentBuilder, parentId: string, depth: number): void {
  if (doc.isFull() || depth > 24) return;

  const text = textContent(node);
  const style = styleFromAttrs(node.attrs);

  if (/^h[1-6]$/.test(node.tag)) {
    doc.addHeading(parentId, text, Number(node.tag.slice(1)), style);
    return;
  }

  switch (node.tag) {
    case "p":
    case "blockquote":
    case "dt":
    case "dd":
      doc.addText(parentId, text, style);
      return;
    case "img": {
      const width = node.attrs.width && /^\d{1,4}$/.test(node.attrs.width) ? { width: `${node.attrs.width}px` } : {};
      doc.addImage(parentId, safeUrl(node.attrs.src), node.attrs.alt ?? "", { ...style, ...width });
      return;
    }
    case "hr":
      doc.addDivider(parentId);
      return;
    case "br":
      return;
    case "a": {
      const href = safeUrl(node.attrs.href) || "#";
      const isButton = /btn|button/i.test(node.attrs.class ?? "") || node.attrs.role === "button";
      doc.addLink(parentId, text, href, isButton, style);
      return;
    }
    case "button":
      doc.addLink(parentId, text, "#", true, style);
      return;
    case "li":
      doc.addText(parentId, text ? `• ${text}` : "", style);
      return;
    case "ul":
    case "ol": {
      for (const child of node.children) {
        if (typeof child === "string") continue;
        if (child.tag === "li") mapNode(child, doc, parentId, depth + 1);
        else mapNode(child, doc, parentId, depth + 1);
      }
      return;
    }
    case "nav": {
      const links = collectLinks(node);
      if (links.length > 0) doc.addNavbar(parentId, links[0]!.label, links, style);
      return;
    }
    case "header": {
      const links = collectLinks(node);
      if (links.length > 0 || containsTag(node, new Set(["nav"]))) {
        const brand = links[0]?.label ?? "Menu";
        doc.addNavbar(parentId, brand, links, style);
        return;
      }
      break;
    }
    case "footer": {
      doc.addFooter(parentId, text, style);
      return;
    }
    case "span":
    case "strong":
    case "b":
    case "em":
    case "i":
    case "small":
    case "time":
    case "label": {
      if (text) doc.addText(parentId, text, style);
      return;
    }
    case "html":
    case "#root": {
      mapChildren(node, doc, parentId, depth);
      return;
    }
    case "table":
    case "tbody":
    case "thead":
    case "tr": {
      const rows: string[] = [];
      const collectRowText = (current: HtmlNode) => {
        for (const child of current.children) {
          if (typeof child === "string") continue;
          if (["td", "th"].includes(child.tag)) {
            const cell = textContent(child);
            if (cell) rows.push(cell);
            continue;
          }
          collectRowText(child);
        }
      };
      collectRowText(node);
      if (rows.length > 0) doc.addText(parentId, rows.join(" · "), style);
      return;
    }
    case "td":
    case "th":
      if (text) doc.addText(parentId, text, style);
      return;
  }

  if (CONTAINER_TAGS.has(node.tag) || node.tag === "section") {
    const containerType = node.tag === "section" ? "section" : "container";
    const containerId = doc.addContainer(parentId, containerType, style);
    mapChildren(node, doc, containerId, depth + 1);
    if (text && !doc.hasChildren(containerId)) {
      doc.addText(containerId, text, {});
    }
    doc.removeIfEmpty(containerId);
    return;
  }

  if (text) {
    doc.addText(parentId, text, style);
    return;
  }

  mapChildren(node, doc, parentId, depth);
}

function mapChildren(node: HtmlNode, doc: DocumentBuilder, parentId: string, depth: number): void {
  for (const child of node.children) {
    if (doc.isFull()) return;
    if (typeof child === "string") {
      const text = collapseText(child);
      if (text) doc.addText(parentId, text, {});
      continue;
    }
    mapNode(child, doc, parentId, depth + 1);
  }
}

export function looksLikeHtml(value: string): boolean {
  return /<(?:!doctype|html|body|main|section|div|h[1-6]|p|header|footer)\b/i.test(value);
}

function extractTitle(html: string): string {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  const title = match ? collapseText(match[1] ?? "") : "";
  return title.slice(0, 200) || "Halaman AI";
}

function extractLang(html: string): string {
  const match = /<html[^>]*\blang\s*=\s*["']?([a-zA-Z-]+)/i.exec(html);
  return match?.[1]?.slice(0, 10) ?? "id";
}

export function convertHtmlToDocument(rawHtml: string): BuilderDocument {
  const html = rawHtml
    .replace(/```html\s*/gi, "")
    .replace(/```/g, "")
    .trim();

  if (!looksLikeHtml(html)) {
    throw new AppError("VALIDATION", "Tidak ada HTML yang dapat dikonversi.");
  }

  const tree = parseHtml(html);
  const doc = new DocumentBuilder();

  const body = (() => {
    let found: HtmlNode | null = null;
    const visit = (node: HtmlNode, depth = 0) => {
      if (found || depth > 4) return;
      for (const child of node.children) {
        if (typeof child === "string") continue;
        if (child.tag === "body") {
          found = child;
          return;
        }
        visit(child, depth + 1);
      }
    };
    visit(tree);
    return found as HtmlNode | null;
  })();

  mapChildren(body ?? tree, doc, doc.root(), 0);

  const document = doc.build({ title: extractTitle(html), lang: extractLang(html) });
  return parseDocument(document);
}
