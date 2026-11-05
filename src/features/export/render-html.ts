import {
  isSafeStyleValue,
  isSafeUrl,
  STYLE_KEYS,
  type Block,
  type BlockStyle,
  type BuilderDocument,
} from "@/features/editor/schemas/document";

const ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ESCAPE_MAP[char] ?? char);
}

function safeHref(value: unknown): string {
  if (typeof value !== "string" || !isSafeUrl(value)) return "#";
  return value;
}

function safeText(value: unknown): string {
  return escapeHtml(typeof value === "string" ? value : "");
}

function cssProperty(key: string): string {
  return key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

export function renderStyleAttribute(style: BlockStyle): string {
  const declarations: string[] = [];

  for (const key of STYLE_KEYS) {
    const value = style[key];
    if (!value || !isSafeStyleValue(value)) continue;
    declarations.push(`${cssProperty(key)}:${value}`);
  }

  return declarations.length > 0 ? ` style="${escapeHtml(declarations.join(";"))}"` : "";
}

function renderChildren(block: Block, doc: BuilderDocument): string {
  return block.children
    .map((childId) => doc.blocks[childId])
    .filter((child): child is Block => Boolean(child))
    .map((child) => renderBlock(child, doc))
    .join("");
}

function renderNavbarItems(items: unknown): string {
  if (!Array.isArray(items)) return "";
  return items
    .slice(0, 8)
    .map((item) => {
      if (typeof item !== "object" || item === null) return "";
      const record = item as Record<string, unknown>;
      return `<a href="${escapeHtml(safeHref(record.href))}">${safeText(record.label)}</a>`;
    })
    .join("");
}

function renderBlock(block: Block, doc: BuilderDocument): string {
  const style = renderStyleAttribute(block.style);
  const inner = renderChildren(block, doc);
  const props = block.props;

  switch (block.type) {
    case "section":
      return `<section${style}>${inner}</section>`;
    case "container":
      return `<div${style}>${inner}</div>`;
    case "columns":
      return `<div class="wb-columns"${style}>${inner}</div>`;
    case "column":
      return `<div class="wb-column"${style}>${inner}</div>`;
    case "heading": {
      const rawLevel = typeof props.level === "number" ? props.level : 2;
      const level = Math.min(6, Math.max(1, Math.round(rawLevel)));
      return `<h${level}${style}>${safeText(props.text)}</h${level}>`;
    }
    case "text":
      return `<p${style}>${safeText(props.text)}</p>`;
    case "image":
      return `<img src="${escapeHtml(safeHref(props.src))}" alt="${safeText(props.alt)}"${style} />`;
    case "button":
      return `<a class="wb-btn" href="${escapeHtml(safeHref(props.href))}"${style}>${safeText(props.text)}</a>`;
    case "link":
      return `<a href="${escapeHtml(safeHref(props.href))}"${style}>${safeText(props.text)}</a>`;
    case "divider":
      return `<hr${style} />`;
    case "spacer":
      return `<div${style} aria-hidden="true"></div>`;
    case "navbar":
      return `<header class="wb-nav"${style}><span>${safeText(props.brand)}</span><nav>${renderNavbarItems(props.items)}</nav></header>`;
    case "hero":
      return `<section class="wb-hero"${style}><h1>${safeText(props.title)}</h1><p>${safeText(props.subtitle)}</p><a class="wb-btn" href="${escapeHtml(safeHref(props.buttonHref))}">${safeText(props.buttonText)}</a>${inner}</section>`;
    case "footer":
      return `<footer class="wb-footer"${style}>${safeText(props.text)}${inner}</footer>`;
    default:
      return inner;
  }
}

const BASE_CSS = `*,*::before,*::after{box-sizing:border-box}
body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;line-height:1.5;color:#111827;background:#ffffff}
img{max-width:100%;height:auto}
.wb-columns{display:flex;flex-wrap:wrap;gap:16px}
.wb-columns>.wb-column{flex:1 1 0;min-width:0}
@media (max-width:767px){.wb-columns>.wb-column{flex:1 1 100%}}
.wb-btn{display:inline-block;padding:12px 20px;background:#2563eb;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600}
.wb-nav{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;padding:16px 0}
.wb-nav nav{display:flex;gap:16px;flex-wrap:wrap}
.wb-nav a{color:inherit;text-decoration:none}
.wb-hero{padding:48px 0}
.wb-hero h1{margin:0 0 12px;font-size:2rem}
.wb-hero p{margin:0 0 20px;color:#4b5563}
.wb-footer{padding:24px 0;border-top:1px solid #e5e7eb;color:#6b7280;font-size:14px}
a{color:#2563eb}`;

export function renderHtml(doc: BuilderDocument): string {
  const root = doc.blocks[doc.rootId];
  const body = root ? renderBlock(root, doc) : "";
  const description = doc.meta.description
    ? `<meta name="description" content="${escapeHtml(doc.meta.description)}" />\n  `
    : "";

  return `<!doctype html>
<html lang="${escapeHtml(doc.meta.lang || "id")}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(doc.meta.title)}</title>
  ${description}<style>
${BASE_CSS}
  </style>
</head>
<body>
${body}
</body>
</html>
`;
}
