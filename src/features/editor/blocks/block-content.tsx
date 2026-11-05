"use client";

import type { CSSProperties } from "react";
import type { Block } from "@/features/editor/schemas/document";

function toCss(style: Block["style"]): CSSProperties {
  return style as CSSProperties;
}

function safeText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function BlockContent({ block, children }: { block: Block; children?: React.ReactNode }) {
  const style = toCss(block.style);
  const props = block.props;

  switch (block.type) {
    case "section":
      return (
        <section style={style} className="min-h-10">
          {children}
        </section>
      );
    case "container":
      return (
        <div style={style} className="min-h-10">
          {children}
        </div>
      );
    case "columns":
      return (
        <div style={{ ...style, display: "flex", flexWrap: "wrap" }} className="min-h-10">
          {children}
        </div>
      );
    case "column":
      return (
        <div style={{ ...style, flex: "1 1 0", minWidth: 0 }} className="min-h-10">
          {children}
        </div>
      );
    case "heading": {
      const level = Math.min(6, Math.max(1, Number(props.level) || 2));
      const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
      return <Tag style={style}>{safeText(props.text)}</Tag>;
    }
    case "text":
      return <p style={style}>{safeText(props.text)}</p>;
    case "image":
      return props.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={safeText(props.src)} alt={safeText(props.alt)} style={style} className="max-w-full" />
      ) : (
        <div
          style={style}
          className="flex h-40 items-center justify-center rounded bg-slate-100 text-sm text-slate-500"
        >
          URL gambar belum diisi
        </div>
      );
    case "button":
      return (
        <a
          href={safeText(props.href) || "#"}
          style={style}
          onClick={(event) => event.preventDefault()}
          className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white"
        >
          {safeText(props.text)}
        </a>
      );
    case "link":
      return (
        <a
          href="#"
          style={style}
          onClick={(event) => event.preventDefault()}
          className="text-blue-600 underline"
        >
          {safeText(props.text)}
        </a>
      );
    case "divider":
      return <hr style={style} />;
    case "spacer":
      return <div style={{ ...style, height: safeText(props.height) || "32px" }} aria-hidden="true" />;
    case "navbar":
      return (
        <header
          style={style}
          className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200"
        >
          <span className="font-semibold">{safeText(props.brand)}</span>
          <nav className="flex flex-wrap gap-4 text-sm text-slate-600">
            {Array.isArray(props.items)
              ? props.items.map((item, index) => {
                  const record = item as { label?: unknown };
                  return <span key={index}>{safeText(record.label)}</span>;
                })
              : null}
          </nav>
        </header>
      );
    case "hero":
      return (
        <section style={style}>
          <h1 className="text-3xl font-bold">{safeText(props.title)}</h1>
          <p className="mt-2 text-slate-600">{safeText(props.subtitle)}</p>
          <span className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white">
            {safeText(props.buttonText)}
          </span>
          {children}
        </section>
      );
    case "footer":
      return (
        <footer style={style} className="text-sm text-slate-500">
          {safeText(props.text)}
          {children}
        </footer>
      );
    default:
      return <div style={style}>{children}</div>;
  }
}
