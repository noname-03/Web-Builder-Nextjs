"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { BLOCK_DEFINITIONS } from "@/features/editor/blocks/registry";
import {
  FONT_WEIGHTS,
  isSafeFontFamily,
  isSafeFontUrl,
  type Block,
  type FontDefinition,
} from "@/features/editor/schemas/document";
import { useEditor } from "@/features/editor/store/editor-context";

type StyleControl =
  | { key: string; label: string; kind: "text"; placeholder?: string }
  | { key: string; label: string; kind: "select"; options: string[] }
  | { key: string; label: string; kind: "color" };

const STYLE_CONTROLS: StyleControl[] = [
  { key: "color", label: "Warna teks", kind: "color" },
  { key: "backgroundColor", label: "Warna latar", kind: "color" },
  { key: "fontSize", label: "Ukuran font", kind: "text", placeholder: "16px" },
  {
    key: "fontWeight",
    label: "Ketebalan font",
    kind: "select",
    options: ["400", "500", "600", "700", "800"],
  },
  {
    key: "textAlign",
    label: "Perataan teks",
    kind: "select",
    options: ["left", "center", "right", "justify"],
  },
  { key: "padding", label: "Padding", kind: "text", placeholder: "16px" },
  { key: "margin", label: "Margin", kind: "text", placeholder: "0 0 12px" },
  { key: "borderRadius", label: "Border radius", kind: "text", placeholder: "8px" },
  { key: "border", label: "Border", kind: "text", placeholder: "1px solid #e5e7eb" },
  { key: "width", label: "Width", kind: "text", placeholder: "100%" },
  { key: "height", label: "Height", kind: "text", placeholder: "auto" },
  { key: "maxWidth", label: "Max width", kind: "text", placeholder: "1200px" },
  { key: "minHeight", label: "Min height", kind: "text", placeholder: "64px" },
  { key: "gap", label: "Gap", kind: "text", placeholder: "16px" },
  { key: "display", label: "Display", kind: "select", options: ["block", "flex", "inline-block"] },
  { key: "flexDirection", label: "Flex direction", kind: "select", options: ["row", "column"] },
  {
    key: "justifyContent",
    label: "Justify",
    kind: "select",
    options: ["flex-start", "center", "flex-end", "space-between"],
  },
  {
    key: "alignItems",
    label: "Align items",
    kind: "select",
    options: ["stretch", "flex-start", "center", "flex-end"],
  },
];

export function Inspector() {
  const selectedId = useEditor((state) => state.selectedId);
  const document = useEditor((state) => state.document);
  const selected = selectedId ? document.blocks[selectedId] : undefined;

  return (
    <aside className="hidden w-72 shrink-0 overflow-y-auto border-l border-slate-200 bg-white p-3 lg:block">
      {selected ? <BlockInspector block={selected} /> : <PageInspector />}
    </aside>
  );
}

function PageInspector() {
  const meta = useEditor((state) => state.document.meta);
  const updateMeta = useEditor((state) => state.updateMeta);
  const blockCount = useEditor((state) => Object.keys(state.document.blocks).length);

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-slate-900">Pengaturan halaman</h2>
      <div>
        <Label htmlFor="meta-title">Judul halaman</Label>
        <Input
          id="meta-title"
          value={meta.title}
          maxLength={200}
          onChange={(event) => updateMeta({ title: event.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="meta-description">Deskripsi</Label>
        <Input
          id="meta-description"
          value={meta.description ?? ""}
          maxLength={500}
          onChange={(event) => updateMeta({ description: event.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="meta-lang">Bahasa</Label>
        <Input
          id="meta-lang"
          value={meta.lang}
          maxLength={10}
          onChange={(event) => updateMeta({ lang: event.target.value })}
        />
      </div>

      <FontManager />

      <p className="text-xs text-slate-500">Total {blockCount} blok pada halaman ini.</p>
    </div>
  );
}

function FontManager() {
  const fonts = useEditor((state) => state.document.fonts);
  const setFonts = useEditor((state) => state.setFonts);
  const defaultFont = useEditor((state) => state.document.meta.fontFamily);
  const updateMeta = useEditor((state) => state.updateMeta);

  const [draftFamily, setDraftFamily] = useState("");
  const [draftUrl, setDraftUrl] = useState("");

  function updateFont(index: number, patch: Partial<FontDefinition>) {
    setFonts(fonts.map((font, fontIndex) => (fontIndex === index ? { ...font, ...patch } : font)));
  }

  function addFont() {
    if (fonts.length >= 3) {
      toast.error("Maksimal 3 font per halaman.");
      return;
    }
    if (!isSafeFontFamily(draftFamily.trim()) || !isSafeFontUrl(draftUrl.trim())) {
      toast.error("Nama font atau URL tidak valid. Gunakan URL https dengan ekstensi woff2/woff/ttf/otf.");
      return;
    }
    if (fonts.some((font) => font.family.toLowerCase() === draftFamily.trim().toLowerCase())) {
      toast.error("Nama font sudah dipakai.");
      return;
    }

    const font: FontDefinition = {
      id: `font-${Date.now().toString(36)}`,
      family: draftFamily.trim(),
      url: draftUrl.trim(),
      weight: "400",
      style: "normal",
    };

    setFonts([...fonts, font]);
    setDraftFamily("");
    setDraftUrl("");
  }

  return (
    <div className="space-y-3 border-t border-slate-200 pt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tipografi</h3>

      {fonts.map((font, index) => (
        <div key={font.id} className="space-y-2 rounded border border-slate-200 p-2">
          <Input
            defaultValue={font.family}
            aria-label="Nama font"
            onBlur={(event) => {
              const value = event.target.value.trim();
              if (!isSafeFontFamily(value)) {
                toast.error("Nama font tidak valid.");
                return;
              }
              updateFont(index, { family: value });
            }}
          />
          <Input
            defaultValue={font.url}
            aria-label="URL font"
            onBlur={(event) => {
              const value = event.target.value.trim();
              if (!isSafeFontUrl(value)) {
                toast.error("URL font harus https dan berekstensi woff2/woff/ttf/otf.");
                return;
              }
              updateFont(index, { url: value });
            }}
          />
          <div className="flex gap-2">
            <select
              value={font.weight ?? "400"}
              aria-label="Ketebalan font"
              onChange={(event) =>
                updateFont(index, { weight: event.target.value as FontDefinition["weight"] })
              }
              className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
            >
              {FONT_WEIGHTS.map((weight) => (
                <option key={weight} value={weight}>
                  {weight}
                </option>
              ))}
            </select>
            <select
              value={font.style ?? "normal"}
              aria-label="Gaya font"
              onChange={(event) =>
                updateFont(index, { style: event.target.value as FontDefinition["style"] })
              }
              className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
            >
              <option value="normal">Normal</option>
              <option value="italic">Italic</option>
            </select>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setFonts(fonts.filter((_, fontIndex) => fontIndex !== index));
              if (defaultFont === font.family) updateMeta({ fontFamily: undefined });
            }}
          >
            Hapus font
          </Button>
        </div>
      ))}

      {fonts.length < 3 ? (
        <div className="space-y-2 rounded border border-dashed border-slate-300 p-2">
          <Input
            value={draftFamily}
            placeholder="Nama font (mis. Inter)"
            aria-label="Nama font baru"
            onChange={(event) => setDraftFamily(event.target.value)}
          />
          <Input
            value={draftUrl}
            placeholder="https://contoh.com/inter.woff2"
            aria-label="URL font baru"
            onChange={(event) => setDraftUrl(event.target.value)}
          />
          <Button size="sm" variant="secondary" onClick={addFont}>
            Tambah font
          </Button>
        </div>
      ) : null}

      <p className="text-xs text-slate-500">
        WOFF2 disarankan. File font lintas domain harus mengizinkan CORS.
      </p>

      <div>
        <Label htmlFor="default-font">Font default halaman</Label>
        <select
          id="default-font"
          value={defaultFont ?? ""}
          onChange={(event) => updateMeta({ fontFamily: event.target.value || undefined })}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Default sistem</option>
          {fonts.map((font) => (
            <option key={font.id} value={font.family}>
              {font.family}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function BlockInspector({ block }: { block: Block }) {
  const definition = BLOCK_DEFINITIONS[block.type];
  const updateProps = useEditor((state) => state.updateProps);
  const updateStyle = useEditor((state) => state.updateStyle);
  const clearStyle = useEditor((state) => state.clearStyle);
  const removeBlock = useEditor((state) => state.removeBlock);
  const fonts = useEditor((state) => state.document.fonts);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">{definition.label}</h2>
        <Button size="sm" variant="ghost" onClick={() => removeBlock(block.id)}>
          Hapus
        </Button>
      </div>

      {definition.fields.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Konten</p>
          {definition.fields.map((field) => {
            const value = block.props[field.key];
            const stringValue =
              typeof value === "string" || typeof value === "number" ? String(value) : "";

            return (
              <div key={field.key}>
                <Label htmlFor={`prop-${block.id}-${field.key}`}>{field.label}</Label>
                {field.kind === "select" ? (
                  <select
                    id={`prop-${block.id}-${field.key}`}
                    value={stringValue || field.options[0]?.value}
                    onChange={(event) => {
                      const next =
                        field.key === "level" ? Number(event.target.value) : event.target.value;
                      updateProps(block.id, { [field.key]: next });
                    }}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    {field.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id={`prop-${block.id}-${field.key}`}
                    value={stringValue}
                    type={field.kind === "number" ? "number" : "text"}
                    min={field.kind === "number" ? 0 : undefined}
                    max={field.kind === "number" ? 100 : undefined}
                    placeholder={field.kind === "number" ? undefined : field.placeholder}
                    onChange={(event) =>
                      updateProps(block.id, {
                        [field.key]:
                          field.kind === "number" ? Number(event.target.value) : event.target.value,
                      })
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {definition.supportsNavbarItems ? <NavbarItemsEditor block={block} /> : null}

      <div className="space-y-3 border-t border-slate-200 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Style</p>

        {fonts.length > 0 ? (
          <div>
            <Label htmlFor={`style-${block.id}-fontFamily`}>Font</Label>
            <select
              id={`style-${block.id}-fontFamily`}
              value={block.style.fontFamily ?? ""}
              onChange={(event) => {
                if (event.target.value === "") {
                  clearStyle(block.id, "fontFamily");
                  return;
                }
                updateStyle(block.id, { fontFamily: event.target.value });
              }}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Default</option>
              {fonts.map((font) => (
                <option key={font.id} value={font.family}>
                  {font.family}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {STYLE_CONTROLS.map((control) => (
          <div key={control.key}>
            <Label htmlFor={`style-${block.id}-${control.key}`}>{control.label}</Label>
            <StyleControlInput
              id={`style-${block.id}-${control.key}`}
              control={control}
              value={block.style[control.key as keyof typeof block.style] ?? ""}
              onChange={(next) => {
                if (next === "") {
                  clearStyle(block.id, control.key);
                  return;
                }
                updateStyle(block.id, { [control.key]: next });
              }}
            />
          </div>
        ))}

        <GradientControl block={block} />
      </div>
    </div>
  );
}

function StyleControlInput({
  id,
  control,
  value,
  onChange,
}: {
  id: string;
  control: StyleControl;
  value: string;
  onChange: (value: string) => void;
}) {
  if (control.kind === "select") {
    return (
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
      >
        <option value="">Default</option>
        {control.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (control.kind === "color") {
    const safeColor = /^#[0-9a-f]{6}$/i.test(value) ? value : "#000000";
    return (
      <div className="flex gap-2">
        <input
          id={id}
          type="color"
          value={safeColor}
          onChange={(event) => onChange(event.target.value)}
          aria-label={`${control.label} picker`}
          className="h-10 w-12 rounded border border-slate-300"
        />
        <Input value={value} placeholder="#000000" onChange={(event) => onChange(event.target.value)} />
      </div>
    );
  }

  return (
    <Input
      id={id}
      value={value}
      placeholder={control.placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function GradientControl({ block }: { block: Block }) {
  const updateStyle = useEditor((state) => state.updateStyle);
  const clearStyle = useEditor((state) => state.clearStyle);

  const [type, setType] = useState<"linear" | "radial">("linear");
  const [angle, setAngle] = useState(135);
  const [startColor, setStartColor] = useState("#2563eb");
  const [endColor, setEndColor] = useState("#9333ea");

  const active = Boolean(block.style.backgroundImage);

  function applyGradient() {
    const value =
      type === "linear"
        ? `linear-gradient(${angle}deg,${startColor},${endColor})`
        : `radial-gradient(circle,${startColor},${endColor})`;
    updateStyle(block.id, { backgroundImage: value });
  }

  return (
    <div className="space-y-2 border-t border-slate-200 pt-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Gradasi latar</p>

      <div className="flex gap-2">
        <select
          value={type}
          aria-label="Tipe gradasi"
          onChange={(event) => setType(event.target.value as "linear" | "radial")}
          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
        >
          <option value="linear">Linear</option>
          <option value="radial">Radial</option>
        </select>
        {type === "linear" ? (
          <Input
            type="number"
            min={0}
            max={360}
            value={angle}
            aria-label="Sudut gradasi"
            onChange={(event) => setAngle(Number(event.target.value))}
          />
        ) : null}
      </div>

      <div className="flex gap-2">
        <input
          type="color"
          value={startColor}
          aria-label="Warna gradasi awal"
          onChange={(event) => setStartColor(event.target.value)}
          className="h-10 w-12 rounded border border-slate-300"
        />
        <input
          type="color"
          value={endColor}
          aria-label="Warna gradasi akhir"
          onChange={(event) => setEndColor(event.target.value)}
          className="h-10 w-12 rounded border border-slate-300"
        />
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={applyGradient}>
          Terapkan gradasi
        </Button>
        {active ? (
          <Button size="sm" variant="ghost" onClick={() => clearStyle(block.id, "backgroundImage")}>
            Hapus
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function NavbarItemsEditor({ block }: { block: Block }) {
  const updateProps = useEditor((state) => state.updateProps);
  const items = Array.isArray(block.props.items)
    ? (block.props.items as Array<{ label?: string; href?: string }>)
    : [];

  const updateItem = (index: number, patch: { label?: string; href?: string }) => {
    const next = items.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...patch } : item,
    );
    updateProps(block.id, { items: next });
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Menu</p>
      {items.map((item, index) => (
        <div key={index} className="space-y-1 rounded border border-slate-200 p-2">
          <Input
            value={item.label ?? ""}
            placeholder="Label"
            maxLength={60}
            onChange={(event) => updateItem(index, { label: event.target.value })}
          />
          <Input
            value={item.href ?? ""}
            placeholder="https://..."
            onChange={(event) => updateItem(index, { href: event.target.value })}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => updateProps(block.id, { items: items.filter((_, i) => i !== index) })}
          >
            Hapus item
          </Button>
        </div>
      ))}
      {items.length < 8 ? (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => updateProps(block.id, { items: [...items, { label: "Menu", href: "#" }] })}
        >
          Tambah item
        </Button>
      ) : null}
    </div>
  );
}
