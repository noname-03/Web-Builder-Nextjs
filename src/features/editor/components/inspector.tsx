"use client";

import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { BLOCK_DEFINITIONS } from "@/features/editor/blocks/registry";
import { useEditor } from "@/features/editor/store/editor-context";
import type { Block } from "@/features/editor/schemas/document";

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
      <p className="text-xs text-slate-500">Total {blockCount} blok pada halaman ini.</p>
    </div>
  );
}

function BlockInspector({ block }: { block: Block }) {
  const definition = BLOCK_DEFINITIONS[block.type];
  const updateProps = useEditor((state) => state.updateProps);
  const updateStyle = useEditor((state) => state.updateStyle);
  const clearStyle = useEditor((state) => state.clearStyle);
  const removeBlock = useEditor((state) => state.removeBlock);

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
                    value={stringValue}
                    onChange={(event) => {
                      const next = field.key === "level" ? Number(event.target.value) : event.target.value;
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
                    placeholder={field.placeholder}
                    onChange={(event) => updateProps(block.id, { [field.key]: event.target.value })}
                  />
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {definition.supportsNavbarItems ? (
        <NavbarItemsEditor block={block} />
      ) : null}

      <div className="space-y-3 border-t border-slate-200 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Style</p>
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
