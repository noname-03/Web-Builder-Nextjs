"use client";

import Link from "next/link";
import { PanelLeft, PanelRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditor } from "@/features/editor/store/editor-context";
import type { Viewport } from "@/features/editor/store/editor-store";

const STATUS_TEXT: Record<string, string> = {
  saved: "Tersimpan",
  dirty: "Belum disimpan",
  saving: "Menyimpan...",
  error: "Gagal menyimpan",
};

const VIEWPORTS: Array<{ value: Viewport; label: string }> = [
  { value: "desktop", label: "Desktop" },
  { value: "tablet", label: "Tablet" },
  { value: "mobile", label: "Mobile" },
];

export function Toolbar({
  onSave,
  onPreview,
  onExport,
  onOpenVersions,
  exporting,
}: {
  onSave: () => void;
  onPreview: () => void;
  onExport: () => void;
  onOpenVersions: () => void;
  exporting: boolean;
}) {
  const title = useEditor((state) => state.title);
  const projectName = useEditor((state) => state.projectName);
  const saveStatus = useEditor((state) => state.saveStatus);
  const viewport = useEditor((state) => state.viewport);
  const setViewport = useEditor((state) => state.setViewport);
  const undo = useEditor((state) => state.undo);
  const redo = useEditor((state) => state.redo);
  const canUndo = useEditor((state) => state.past.length > 0);
  const canRedo = useEditor((state) => state.future.length > 0);
  const panels = useEditor((state) => state.panels);
  const togglePanel = useEditor((state) => state.togglePanel);

  const saveDisabled = saveStatus === "saved" || saveStatus === "saving";

  return (
    <header className="border-b border-slate-200 bg-white px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-900">
            ← Dashboard
          </Link>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
            <p className="truncate text-xs text-slate-500">{projectName}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-md border border-slate-300 p-0.5">
            <button
              type="button"
              aria-label={panels.palette ? "Sembunyikan panel blok" : "Tampilkan panel blok"}
              aria-pressed={panels.palette}
              title={panels.palette ? "Sembunyikan panel blok ([)" : "Tampilkan panel blok ([)"}
              onClick={() => togglePanel("palette")}
              className={
                panels.palette
                  ? "rounded bg-slate-900 p-1.5 text-white"
                  : "rounded p-1.5 text-slate-500 hover:bg-slate-100"
              }
            >
              <PanelLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={panels.inspector ? "Sembunyikan panel properti" : "Tampilkan panel properti"}
              aria-pressed={panels.inspector}
              title={panels.inspector ? "Sembunyikan panel properti (])" : "Tampilkan panel properti (])"}
              onClick={() => togglePanel("inspector")}
              className={
                panels.inspector
                  ? "rounded bg-slate-900 p-1.5 text-white"
                  : "rounded p-1.5 text-slate-500 hover:bg-slate-100"
              }
            >
              <PanelRight className="size-4" aria-hidden="true" />
            </button>
          </div>

          <div className="flex rounded-md border border-slate-300 p-0.5">
            {VIEWPORTS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setViewport(item.value)}
                className={
                  viewport === item.value
                    ? "rounded bg-slate-900 px-2 py-1 text-xs text-white"
                    : "rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                }
              >
                {item.label}
              </button>
            ))}
          </div>

          <Button size="sm" variant="secondary" onClick={undo} disabled={!canUndo}>
            Undo
          </Button>
          <Button size="sm" variant="secondary" onClick={redo} disabled={!canRedo}>
            Redo
          </Button>

          <span
            aria-live="polite"
            className={
              saveStatus === "error"
                ? "text-xs font-medium text-red-600"
                : "text-xs font-medium text-slate-500"
            }
          >
            {STATUS_TEXT[saveStatus] ?? ""}
          </span>

          <Button size="sm" variant="secondary" onClick={onSave} disabled={saveDisabled}>
            Simpan
          </Button>
          <Button size="sm" variant="secondary" onClick={onOpenVersions}>
            Riwayat
          </Button>
          <Button size="sm" variant="secondary" onClick={onPreview}>
            Preview
          </Button>
          <Button size="sm" loading={exporting} onClick={onExport}>
            Export
          </Button>
        </div>
      </div>
    </header>
  );
}
