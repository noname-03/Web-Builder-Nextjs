import type { CSSProperties } from "react";
import { isSafeBackgroundUrl } from "@/features/editor/schemas/document";

const SIZE_VALUES = ["cover", "contain", "auto"];
const POSITION_VALUES = ["center", "top", "bottom", "left", "right"];
const MIN_HEIGHT_PATTERN = /^\d{1,4}(px|vh|rem)$/;

export function parseHexColor(value: unknown): { r: number; g: number; b: number } | null {
  if (typeof value !== "string" || !/^#[0-9a-f]{6}$/i.test(value)) return null;
  return {
    r: Number.parseInt(value.slice(1, 3), 16),
    g: Number.parseInt(value.slice(3, 5), 16),
    b: Number.parseInt(value.slice(5, 7), 16),
  };
}

export function safeBackgroundImage(props: Record<string, unknown>): string | null {
  if (typeof props.backgroundImage !== "string") return null;
  const value = props.backgroundImage.trim();
  if (value === "" || !isSafeBackgroundUrl(value)) return null;
  return value;
}

export function overlayGradient(props: Record<string, unknown>): string | null {
  const color = parseHexColor(props.overlayColor);
  if (!color) return null;

  const rawOpacity = typeof props.overlayOpacity === "number" ? props.overlayOpacity : Number(props.overlayOpacity);
  if (!Number.isFinite(rawOpacity)) return null;

  const alpha = Math.min(100, Math.max(0, rawOpacity)) / 100;
  const rgb = `rgba(${color.r},${color.g},${color.b},${alpha})`;
  return `linear-gradient(${rgb},${rgb})`;
}

export type BackgroundSettings = {
  image: string;
  overlay: string | null;
  size: string;
  position: string;
  minHeight: string | null;
};

export function backgroundSettings(props: Record<string, unknown>): BackgroundSettings | null {
  const image = safeBackgroundImage(props);
  if (!image) return null;

  return {
    image,
    overlay: overlayGradient(props),
    size:
      typeof props.backgroundSize === "string" && SIZE_VALUES.includes(props.backgroundSize)
        ? props.backgroundSize
        : "cover",
    position:
      typeof props.backgroundPosition === "string" && POSITION_VALUES.includes(props.backgroundPosition)
        ? props.backgroundPosition
        : "center",
    minHeight:
      typeof props.minHeight === "string" && MIN_HEIGHT_PATTERN.test(props.minHeight)
        ? props.minHeight
        : null,
  };
}

export function backgroundCss(props: Record<string, unknown>): CSSProperties {
  const settings = backgroundSettings(props);
  if (!settings) return {};

  return {
    backgroundImage: settings.overlay
      ? `${settings.overlay}, url("${settings.image}")`
      : `url("${settings.image}")`,
    backgroundSize: settings.size,
    backgroundPosition: settings.position,
    backgroundRepeat: "no-repeat",
    minHeight: settings.minHeight ?? undefined,
  };
}
