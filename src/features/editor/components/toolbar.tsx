"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { ChevronDown, Download, PanelLeft, PanelRight, Share2 } from "lucide-react";
import { Button, Spinner } from "@/components/ui/button";
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

const PANEL_HINT_ID = "panel-toggle-hint";

export function Toolbar({
  onSave,
  onPreview,
  onExport,
  onOpenPublish,
  onOpenVersions,
  exporting,
}: {
  onSave: () => void;
  onPreview: () => void;
  onExport: () => void;
  onOpenPublish: () => void;
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

  const exportMenuContainerRef = useRef<HTMLDivElement>(null);
  const exportTriggerRef = useRef<HTMLButtonElement>(null);
  const exportItemsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  useEffect(() => {
    if (!exportMenuOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const container = exportMenuContainerRef.current;
      if (!container) return;
      if (event.target instanceof Node && container.contains(event.target)) return;
      setExportMenuOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [exportMenuOpen]);

  useEffect(() => {
    if (!exportMenuOpen) return;
    exportItemsRef.current[0]?.focus();
  }, [exportMenuOpen]);

  function closeExportMenu(restoreFocus = false) {
    setExportMenuOpen(false);
    if (restoreFocus) exportTriggerRef.current?.focus();
  }

  function handleExportMenuKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeExportMenu(true);
      return;
    }

    if (event.key === "Tab") {
      setExportMenuOpen(false);
      return;
    }

    if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Home" && event.key !== "End") {
      return;
    }

    event.preventDefault();
    const items = exportItemsRef.current.filter((item): item is HTMLButtonElement => item !== null);
    if (items.length === 0) return;

    const activeIndex = items.indexOf(document.activeElement as HTMLButtonElement);

    if (event.key === "Home") {
      items[0]?.focus();
      return;
    }
    if (event.key === "End") {
      items[items.length - 1]?.focus();
      return;
    }
    if (event.key === "ArrowDown") {
      items[(activeIndex + 1) % items.length]?.focus();
      return;
    }
    items[(activeIndex - 1 + items.length) % items.length]?.focus();
  }

  function handleExportMenuItem(action: () => void) {
    closeExportMenu(true);
    action();
  }

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
          <div className="flex flex-col gap-1">
            <div role="group" aria-label="Panel editor" className="flex items-stretch gap-1.5">
              <PanelToggleButton
                testId="toggle-palette"
                open={panels.palette}
                shortLabel="Blok"
                fullLabel="Panel blok"
                shortcut="["
                onClick={() => togglePanel("palette")}
                icon={<PanelLeft className="size-4" aria-hidden="true" />}
              />
              <PanelToggleButton
                testId="toggle-inspector"
                open={panels.inspector}
                shortLabel="Properti"
                fullLabel="Panel properti"
                shortcut="]"
                onClick={() => togglePanel("inspector")}
                icon={<PanelRight className="size-4" aria-hidden="true" />}
              />
            </div>
            <p
              id={PANEL_HINT_ID}
              className="hidden text-[11px] leading-none text-slate-500 lg:block"
            >
              Sembunyikan panel untuk memperbesar kanvas
            </p>
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

          <div ref={exportMenuContainerRef} className="relative">
            <button
              ref={exportTriggerRef}
              type="button"
              disabled={exporting}
              aria-haspopup="menu"
              aria-expanded={exportMenuOpen}
              aria-controls="export-menu"
              data-testid="export-menu-trigger"
              onClick={() => setExportMenuOpen((open) => !open)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setExportMenuOpen(true);
                }
                if (event.key === "Escape") closeExportMenu(true);
              }}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-blue-600 px-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              {exporting ? <Spinner /> : null}
              Export
              <ChevronDown className="size-4" aria-hidden="true" />
            </button>

            {exportMenuOpen ? (
              <div
                id="export-menu"
                role="menu"
                aria-label="Menu export"
                data-testid="export-menu"
                onKeyDown={handleExportMenuKeyDown}
                className="absolute right-0 z-30 mt-1 w-56 rounded-md border border-slate-200 bg-white p-1 text-left shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  ref={(element) => {
                    exportItemsRef.current[0] = element;
                  }}
                  data-testid="export-download-html"
                  disabled={exporting}
                  onClick={() => handleExportMenuItem(onExport)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100 focus:bg-slate-100 focus:outline-none disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  <Download className="size-4 shrink-0" aria-hidden="true" />
                  Download HTML
                </button>
                <button
                  type="button"
                  role="menuitem"
                  ref={(element) => {
                    exportItemsRef.current[1] = element;
                  }}
                  data-testid="export-publish"
                  onClick={() => handleExportMenuItem(onOpenPublish)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100 focus:bg-slate-100 focus:outline-none"
                >
                  <Share2 className="size-4 shrink-0" aria-hidden="true" />
                  Publish halaman
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

function PanelToggleButton({
  testId,
  open,
  shortLabel,
  fullLabel,
  shortcut,
  icon,
  onClick,
}: {
  testId: string;
  open: boolean;
  shortLabel: string;
  fullLabel: string;
  shortcut: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  const status = open ? "Terbuka" : "Tersembunyi";

  return (
    <button
      type="button"
      data-testid={testId}
      aria-pressed={open}
      aria-describedby={PANEL_HINT_ID}
      aria-keyshortcuts={shortcut}
      title={`${fullLabel}: ${status}. Klik untuk ${
        open ? "menyembunyikan" : "menampilkan"
      } (${shortcut})`}
      onClick={onClick}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900",
        open
          ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-800"
          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span className="whitespace-nowrap">
        <span className="hidden xl:inline">{fullLabel}</span>
        <span className="xl:hidden">{shortLabel}</span>
      </span>
      <span
        className={clsx(
          "whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide",
          open ? "text-white/70" : "text-slate-500",
        )}
      >
        {status}
      </span>
    </button>
  );
}
