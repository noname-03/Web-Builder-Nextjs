import { renderFontFaceCss } from "@/features/export/font-css";
import { backgroundSettings } from "@/features/editor/lib/background";
import {
  isSafeFontFamily,
  isSafeFontUrl,
  isSafeGradient,
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

export function renderStyleDeclarations(style: BlockStyle): string[] {
  const declarations: string[] = [];

  for (const key of STYLE_KEYS) {
    const value = style[key];
    if (!value) continue;

    if (key === "backgroundImage") {
      if (!isSafeGradient(value)) continue;
    } else if (key === "fontFamily") {
      if (!isSafeFontFamily(value)) continue;
    } else if (!isSafeStyleValue(value)) {
      continue;
    }

    declarations.push(`${cssProperty(key)}:${value}`);
  }

  return declarations;
}

function backgroundDeclarations(props: Record<string, unknown>): string[] {
  const settings = backgroundSettings(props);
  if (!settings) return [];

  const image = settings.overlay
    ? `${settings.overlay},url("${settings.image}")`
    : `url("${settings.image}")`;

  const declarations = [
    `background-image:${image}`,
    `background-size:${settings.size}`,
    `background-position:${settings.position}`,
    "background-repeat:no-repeat",
  ];

  if (settings.minHeight) declarations.push(`min-height:${settings.minHeight}`);
  return declarations;
}

function attributeFromDeclarations(declarations: string[]): string {
  if (declarations.length === 0) return "";
  return ` style="${escapeHtml(declarations.join(";"))}"`;
}

export function renderStyleAttribute(style: BlockStyle): string {
  return attributeFromDeclarations(renderStyleDeclarations(style));
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

function renderBrand(props: Record<string, unknown>): string {
  const brandImage = typeof props.brandImage === "string" ? props.brandImage.trim() : "";
  const isImage = props.brandType === "image" && brandImage !== "";
  const width =
    typeof props.brandImageWidth === "string" && /^\d{1,4}(px|%|rem)$/.test(props.brandImageWidth)
      ? props.brandImageWidth
      : null;

  if (isImage && isSafeUrl(brandImage)) {
    const style = width ? ` style="width:${width};height:auto"` : ' style="height:auto"';
    return `<img src="${escapeHtml(safeHref(brandImage))}" alt="${safeText(props.brandImageAlt ?? props.brand)}"${style} />`;
  }

  return `<span>${safeText(props.brand)}</span>`;
}

function renderBlock(block: Block, doc: BuilderDocument): string {
  const style = renderStyleAttribute(block.style);
  const inner = renderChildren(block, doc);
  const props = block.props;

  switch (block.type) {
    case "section": {
      const declarations = [...renderStyleDeclarations(block.style), ...backgroundDeclarations(props)];
      return `<section${attributeFromDeclarations(declarations)}>${inner}</section>`;
    }
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
      return `<header class="wb-nav"${style}>${renderBrand(props)}<nav>${renderNavbarItems(props.items)}</nav></header>`;
    case "hero": {
      const declarations = [...renderStyleDeclarations(block.style), ...backgroundDeclarations(props)];
      return `<section class="wb-hero"${attributeFromDeclarations(declarations)}><h1>${safeText(props.title)}</h1><p>${safeText(props.subtitle)}</p><a class="wb-btn" href="${escapeHtml(safeHref(props.buttonHref))}">${safeText(props.buttonText)}</a>${inner}</section>`;
    }
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
.wb-hero{padding:48px 0;background-size:cover;background-position:center}
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

  const validFonts = doc.fonts.filter((font) => isSafeFontUrl(font.url) && isSafeFontFamily(font.family));
  const fontFaceCss = validFonts.length > 0 ? renderFontFaceCss(validFonts) : "";
  const defaultFont =
    doc.meta.fontFamily && isSafeFontFamily(doc.meta.fontFamily)
      ? `body{font-family:"${doc.meta.fontFamily}",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}`
      : "";

  return `<!doctype html>
<html lang="${escapeHtml(doc.meta.lang || "id")}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(doc.meta.title)}</title>
  ${description}<style>
${BASE_CSS}
${fontFaceCss}
${defaultFont}
  </style>
</head>
<body>
${body}
</body>
</html>
`;
}
