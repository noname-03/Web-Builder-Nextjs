import type { FontDefinition } from "@/features/editor/schemas/document";

export function fontFormatForUrl(url: string): string {
  if (/\.woff2(\?|$)/i.test(url)) return "woff2";
  if (/\.woff(\?|$)/i.test(url)) return "woff";
  if (/\.ttf(\?|$)/i.test(url)) return "truetype";
  return "opentype";
}

export function renderFontFaceCss(fonts: FontDefinition[]): string {
  return fonts
    .map((font) => {
      const weight = font.weight ? `font-weight:${font.weight};` : "";
      const style = font.style ? `font-style:${font.style};` : "";
      return `@font-face{font-family:"${font.family}";src:url("${font.url}") format("${fontFormatForUrl(font.url)}");${weight}${style}font-display:swap}`;
    })
    .join("\n");
}
