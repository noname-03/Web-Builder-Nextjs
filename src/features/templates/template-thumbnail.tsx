import { clsx } from "clsx";
import type { CSSProperties } from "react";
import type { TemplateMeta, TemplateThumbnailVariant } from "@/features/templates/template-meta";

/**
 * Decorative, asset-free miniature of a template page.
 *
 * Pure presentational component: no client directive, no hooks, no images and no
 * network requests — everything is drawn with divs/spans and inline colors.
 */

const DARK_SHADE = "#0f172a";
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

function tint(accentColor: string, alpha: string, fallback: string): string {
  return HEX_COLOR_PATTERN.test(accentColor) ? `${accentColor}${alpha}` : fallback;
}

function Bar({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return <span className={clsx("block rounded-full", className)} style={style} />;
}

function MiniNavbar({ accentColor }: { accentColor: string }) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <span className="size-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
      <Bar className="h-1 w-5 bg-slate-300" />
      <span className="ml-auto flex items-center gap-1">
        <Bar className="h-1 w-3 bg-slate-200" />
        <Bar className="h-1 w-3 bg-slate-200" />
        <Bar className="h-1 w-4" style={{ backgroundColor: accentColor }} />
      </span>
    </div>
  );
}

function MiniHero({ background }: { background: string }) {
  return (
    <div
      className="flex h-[44%] shrink-0 flex-col justify-center gap-1 rounded px-2"
      style={{ background }}
    >
      <Bar className="h-1.5 w-3/4 bg-white/85" />
      <Bar className="h-1 w-1/2 bg-white/60" />
      <Bar className="mt-1 h-2 w-8 rounded-sm bg-white/90" />
    </div>
  );
}

function MiniBody({
  variant,
  accentColor,
  softTint,
}: {
  variant: TemplateThumbnailVariant;
  accentColor: string;
  softTint: string;
}) {
  if (variant === "image") {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-1">
        <div className="min-h-0 flex-1 rounded" style={{ backgroundColor: softTint }} />
        <Bar className="h-1 w-1/3 bg-slate-200" />
      </div>
    );
  }

  if (variant === "editorial") {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-1">
        <Bar className="h-1 w-full bg-slate-200" />
        <Bar className="h-1 w-11/12 bg-slate-200" />
        <Bar className="h-1 w-4/5 bg-slate-200" />
        <Bar className="h-1 w-2/3 bg-slate-200" />
        <Bar className="mt-auto h-1 w-1/4" style={{ backgroundColor: accentColor }} />
      </div>
    );
  }

  if (variant === "menu") {
    return (
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-1.5">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="flex min-h-0 flex-col gap-1 rounded border border-slate-200 p-1"
            style={{ backgroundColor: index === 1 ? softTint : "#ffffff" }}
          >
            <Bar className="h-1.5 w-2/3" style={{ backgroundColor: accentColor }} />
            <Bar className="h-1 w-full bg-slate-200" />
            <Bar className="h-1 w-3/4 bg-slate-200" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "pricing") {
    return (
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-1.5">
        {[0, 1, 2].map((index) => {
          const highlighted = index === 1;
          return (
            <div
              key={index}
              className={clsx(
                "flex min-h-0 flex-col items-center justify-center gap-1 rounded border p-1",
                highlighted ? "border-transparent" : "border-slate-200",
              )}
              style={{ backgroundColor: highlighted ? accentColor : "#ffffff" }}
            >
              <Bar
                className="h-1 w-2/3"
                style={{ backgroundColor: highlighted ? "#ffffff" : accentColor }}
              />
              <Bar className={clsx("h-2 w-1/2 rounded-sm", highlighted ? "bg-white/70" : "bg-slate-300")} />
              <Bar className={clsx("h-1 w-3/4", highlighted ? "bg-white/50" : "bg-slate-200")} />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid min-h-0 flex-1 grid-cols-2 gap-1.5">
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="min-h-0 rounded" style={{ backgroundColor: softTint }} />
      ))}
    </div>
  );
}

export function TemplateThumbnail({
  meta,
  name,
  className,
}: {
  meta: TemplateMeta;
  name?: string;
  className?: string;
}) {
  const accentColor = meta.accentColor;
  const softTint = tint(accentColor, "1f", "#f1f5f9");
  const mediumTint = tint(accentColor, "59", "#e2e8f0");
  const heroBackground =
    meta.thumbnailVariant === "gradient"
      ? `linear-gradient(135deg, ${accentColor}, ${DARK_SHADE})`
      : meta.thumbnailVariant === "blank"
        ? "#f8fafc"
        : `linear-gradient(135deg, ${accentColor}, ${mediumTint})`;

  return (
    <div
      role="img"
      aria-label={`Pratinjau template ${name ?? meta.category}`}
      className={clsx(
        "aspect-[16/10] w-full overflow-hidden rounded-md border border-slate-200 bg-white",
        className,
      )}
    >
      <div className="flex h-full w-full flex-col gap-1.5 p-2">
        <MiniNavbar accentColor={accentColor} />
        {meta.thumbnailVariant === "blank" ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1.5 rounded border border-dashed border-slate-300 bg-slate-50">
            <Bar className="h-1.5 w-1/2 bg-slate-200" />
            <Bar className="h-1 w-1/3 bg-slate-200" />
          </div>
        ) : (
          <>
            <MiniHero background={heroBackground} />
            <MiniBody variant={meta.thumbnailVariant} accentColor={accentColor} softTint={softTint} />
          </>
        )}
      </div>
    </div>
  );
}
