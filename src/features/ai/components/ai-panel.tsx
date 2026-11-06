"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Label } from "@/components/ui/input";
import {
  clearAiHistoryAction,
  generateDocumentAction,
  listAiHistoryAction,
  listProvidersAction,
} from "@/features/ai/actions";
import { AI_PROMPT_MAX_CHARS, AI_PROMPT_PRESETS, AI_STYLE_OPTIONS } from "@/features/ai/constants";
import type { AiGenerationHistoryItem, AiProviderPublic, GenerateDocumentResult } from "@/features/ai/types";
import { renderHtml } from "@/features/export/render-html";
import { useEditor } from "@/features/editor/store/editor-context";
import type { BuilderDocument } from "@/features/editor/schemas/document";

type Mode = "GENERATE" | "MODIFY";
type StyleValue = "minimal" | "bold" | "elegan" | "playful";

export function AiPanel() {
  const pageId = useEditor((state) => state.pageId);
  const revision = useEditor((state) => state.revision);
  const applyDocument = useEditor((state) => state.applyDocument);

  const [providers, setProviders] = useState<AiProviderPublic[] | null>(null);
  const [providerId, setProviderId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<Mode>("GENERATE");
  const [style, setStyle] = useState<StyleValue | "">("");
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateDocumentResult | null>(null);
  const [history, setHistory] = useState<AiGenerationHistoryItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listProvidersAction().then((response) => {
      if (cancelled) return;
      if (!response.ok) {
        setProviders([]);
        return;
      }
      setProviders(response.data);
      const defaultProvider = response.data.find((provider) => provider.isDefault) ?? response.data[0];
      if (defaultProvider) setProviderId(defaultProvider.id);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleGenerate() {
    if (prompt.trim().length < 3) {
      toast.error("Tulis prompt minimal 3 karakter.");
      return;
    }

    setPending(true);
    setErrorMessage(null);

    const response = await generateDocumentAction({
      pageId,
      prompt,
      mode,
      style: style || undefined,
      providerId: providerId || undefined,
    });

    setPending(false);

    if (!response.ok) {
      setErrorMessage(response.error.message);
      toast.error(response.error.message);
      return;
    }

    setResult(response.data);
  }

  async function handleLoadHistory() {
    const response = await listAiHistoryAction();
    if (!response.ok) {
      toast.error(response.error.message);
      return;
    }
    setHistory(response.data);
  }

  async function handleClearHistory() {
    const response = await clearAiHistoryAction();
    if (!response.ok) {
      toast.error(response.error.message);
      return;
    }
    setHistory([]);
    toast.success("Riwayat AI dihapus.");
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">Asisten AI</h2>
        <p className="mt-1 text-xs text-slate-500">
          Konten halaman dikirim ke provider AI yang Anda pilih. AI hanya memakai blok yang tersedia.
        </p>
      </div>

      {providers !== null && providers.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-300 p-3 text-sm text-slate-600">
          <p>Belum ada provider AI.</p>
          <a href="/settings/ai" className="mt-2 inline-block text-blue-600 hover:underline">
            Atur provider AI
          </a>
        </div>
      ) : null}

      <div>
        <Label htmlFor="ai-provider">Provider</Label>
        <select
          id="ai-provider"
          value={providerId}
          onChange={(event) => setProviderId(event.target.value)}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          {(providers ?? []).map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.name} · {provider.model}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="ai-mode">Mode</Label>
          <select
            id="ai-mode"
            value={mode}
            onChange={(event) => setMode(event.target.value as Mode)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="GENERATE">Buat baru</option>
            <option value="MODIFY">Ubah halaman ini</option>
          </select>
        </div>
        <div>
          <Label htmlFor="ai-style">Gaya</Label>
          <select
            id="ai-style"
            value={style}
            onChange={(event) => setStyle(event.target.value as StyleValue | "")}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Bebas</option>
            {AI_STYLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="ai-prompt">Prompt</Label>
        <textarea
          id="ai-prompt"
          value={prompt}
          maxLength={AI_PROMPT_MAX_CHARS}
          onChange={(event) => setPrompt(event.target.value)}
          rows={5}
          placeholder="Contoh: Landing page SaaS dengan hero gradasi biru dan tiga kartu fitur"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        />
        <p className="mt-1 text-right text-xs text-slate-400">
          {prompt.length}/{AI_PROMPT_MAX_CHARS}
        </p>
      </div>

      <div className="flex flex-wrap gap-1">
        {AI_PROMPT_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setPrompt(preset)}
            className="rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
          >
            {preset.slice(0, 32)}…
          </button>
        ))}
      </div>

      {errorMessage ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <Button className="w-full" loading={pending} onClick={handleGenerate}>
        {pending ? "Menghasilkan..." : "Buat dengan AI"}
      </Button>

      <div className="border-t border-slate-200 pt-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Riwayat</p>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={handleLoadHistory}>
              Muat
            </Button>
            {history && history.length > 0 ? (
              <Button size="sm" variant="ghost" onClick={handleClearHistory}>
                Hapus
              </Button>
            ) : null}
          </div>
        </div>

        {history === null ? (
          <p className="mt-2 text-xs text-slate-500">Klik Muat untuk melihat 10 permintaan terakhir.</p>
        ) : history.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">Belum ada riwayat.</p>
        ) : (
          <ul className="mt-2 max-h-56 space-y-2 overflow-y-auto">
            {history.map((item) => (
              <li key={item.id} className="rounded border border-slate-200 p-2 text-xs">
                <p className="font-medium text-slate-700">
                  {item.mode === "MODIFY" ? "Ubah" : "Buat"} · {item.status}
                </p>
                <p className="mt-0.5 line-clamp-2 text-slate-500">{item.prompt}</p>
                <button
                  type="button"
                  className="mt-1 text-blue-600 hover:underline"
                  onClick={() => setPrompt(item.prompt)}
                >
                  Pakai prompt ini
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog
        open={result !== null}
        onClose={() => setResult(null)}
        title="Pratinjau hasil AI"
        description="Periksa hasil sebelum menerapkan ke halaman."
      >
        {result ? (
          <div className="space-y-3">
            {result.baseRevision !== revision ? (
              <p className="rounded bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Halaman berubah sejak permintaan ini dibuat. Periksa pratinjau sebelum menerapkan.
              </p>
            ) : null}
            <div className="h-72 overflow-hidden rounded border border-slate-200">
              <iframe
                title="Pratinjau AI"
                sandbox=""
                srcDoc={renderHtml(result.document as BuilderDocument)}
                className="h-full w-full"
              />
            </div>
            {result.warnings.length > 0 ? (
              <ul className="space-y-1 rounded bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {result.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            ) : null}
            <p className="text-xs text-slate-500">
              {result.provider.name} · {result.provider.model} · {result.usage.durationMs} ms
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setResult(null)}>
                Buang
              </Button>
              <Button
                onClick={() => {
                  applyDocument(result.document as BuilderDocument);
                  toast.success("Hasil AI diterapkan. Autosave berjalan.");
                  setResult(null);
                }}
              >
                Terapkan
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>

      <p className="text-[11px] text-slate-400">
        Hasil AI dapat di-undo dengan Ctrl+Z dan otomatis disimpan setelah diterapkan.
      </p>
    </div>
  );
}
