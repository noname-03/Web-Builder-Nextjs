"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormError, Input, Label } from "@/components/ui/input";
import {
  deleteProviderAction,
  listProvidersAction,
  saveProviderAction,
  setDefaultProviderAction,
  testProviderAction,
} from "@/features/ai/actions";
import { PROVIDER_PRESETS } from "@/features/ai/constants";
import type { AiProviderPublic } from "@/features/ai/types";

type FormState = {
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: string;
  maxTokens: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  baseUrl: "",
  apiKey: "",
  model: "",
  temperature: "0.7",
  maxTokens: "4096",
};

export function ProvidersManager({ initialProviders }: { initialProviders: AiProviderPublic[] }) {
  const router = useRouter();
  const [providers, setProviders] = useState(initialProviders);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AiProviderPublic | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<{ message: string; fields?: Record<string, string[]> } | null>(null);

  async function refresh() {
    const response = await listProvidersAction();
    if (response.ok) setProviders(response.data);
    router.refresh();
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setOpen(true);
  }

  function openEdit(provider: AiProviderPublic) {
    setEditing(provider);
    setForm({
      name: provider.name,
      baseUrl: provider.baseUrl,
      apiKey: "",
      model: provider.model,
      temperature: String(provider.temperature),
      maxTokens: String(provider.maxTokens),
    });
    setError(null);
    setOpen(true);
  }

  function applyPreset(presetId: string) {
    const preset = PROVIDER_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    setForm((current) => ({
      ...current,
      name: current.name || preset.label,
      baseUrl: preset.baseUrl,
      model: preset.model,
    }));
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const payload = {
      name: form.name,
      baseUrl: form.baseUrl,
      model: form.model,
      temperature: Number(form.temperature),
      maxTokens: Number(form.maxTokens),
      ...(editing ? { providerId: editing.id } : { apiKey: form.apiKey }),
      ...(editing && form.apiKey.trim() !== "" ? { apiKey: form.apiKey } : {}),
    };

    const response = await saveProviderAction(
      payload as Parameters<typeof saveProviderAction>[0],
    );
    setPending(false);

    if (!response.ok) {
      setError({ message: response.error.message, fields: response.error.fieldErrors });
      return;
    }

    toast.success(editing ? "Provider diperbarui." : "Provider ditambahkan.");
    setOpen(false);
    await refresh();
  }

  async function handleDefault(providerId: string) {
    const response = await setDefaultProviderAction(providerId);
    if (!response.ok) {
      toast.error(response.error.message);
      return;
    }
    toast.success("Provider default diperbarui.");
    await refresh();
  }

  async function handleTest(providerId: string) {
    const response = await testProviderAction(providerId);
    if (!response.ok) {
      toast.error(response.error.message);
      return;
    }
    toast.success(`Koneksi berhasil (${response.data.latencyMs} ms).`);
  }

  async function handleDelete(provider: AiProviderPublic) {
    if (!window.confirm(`Hapus provider "${provider.name}"?`)) return;
    const response = await deleteProviderAction(provider.id);
    if (!response.ok) {
      toast.error(response.error.message);
      return;
    }
    toast.success("Provider dihapus.");
    await refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Pengaturan AI</h1>
          <p className="mt-1 text-sm text-slate-600">
            Simpan API key provider OpenAI-compatible. Key dienkripsi dan tidak ditampilkan kembali.
          </p>
        </div>
        <Button onClick={openCreate}>Tambah provider</Button>
      </div>

      {providers.length === 0 ? (
        <Card className="p-6 text-sm text-slate-600">
          Belum ada provider. Tambahkan Base URL dan API key, lalu gunakan panel Asisten AI di editor.
        </Card>
      ) : (
        <div className="grid gap-3">
          {providers.map((provider) => (
            <Card key={provider.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-slate-900">{provider.name}</h2>
                    {provider.isDefault ? <Badge tone="success">Default</Badge> : null}
                  </div>
                  <p className="mt-1 break-all text-xs text-slate-500">{provider.baseUrl}</p>
                  <p className="mt-1 text-sm text-slate-700">
                    {provider.model} · key {provider.keyHint}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => handleTest(provider.id)}>
                    Tes
                  </Button>
                  {!provider.isDefault ? (
                    <Button size="sm" variant="secondary" onClick={() => handleDefault(provider.id)}>
                      Jadikan default
                    </Button>
                  ) : null}
                  <Button size="sm" variant="secondary" onClick={() => openEdit(provider)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(provider)}>
                    Hapus
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit provider" : "Tambah provider"}
        description="Kompatibel dengan endpoint /chat/completions."
      >
        {open ? (
          <form onSubmit={handleSave} className="space-y-3" noValidate>
            {!editing ? (
              <div>
                <Label htmlFor="provider-preset">Preset</Label>
                <select
                  id="provider-preset"
                  defaultValue=""
                  onChange={(event) => applyPreset(event.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Pilih preset (opsional)</option>
                  {PROVIDER_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div>
              <Label htmlFor="provider-name">Nama</Label>
              <Input
                id="provider-name"
                value={form.name}
                maxLength={80}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
              <FormError messages={error?.fields?.name} />
            </div>

            <div>
              <Label htmlFor="provider-base-url">Base URL</Label>
              <Input
                id="provider-base-url"
                value={form.baseUrl}
                placeholder="https://api.openai.com/v1"
                onChange={(event) => setForm({ ...form, baseUrl: event.target.value })}
              />
              <FormError messages={error?.fields?.baseUrl} />
            </div>

            <div>
              <Label htmlFor="provider-key">API Key</Label>
              <Input
                id="provider-key"
                type="password"
                autoComplete="off"
                value={form.apiKey}
                placeholder={editing ? `Tersimpan: ${editing.keyHint}` : "sk-..."}
                onChange={(event) => setForm({ ...form, apiKey: event.target.value })}
              />
              <p className="mt-1 text-xs text-slate-500">
                {editing ? "Kosongkan jika tidak ingin mengganti key." : "Key disimpan terenkripsi."}
              </p>
              <FormError messages={error?.fields?.apiKey} />
            </div>

            <div>
              <Label htmlFor="provider-model">Model</Label>
              <Input
                id="provider-model"
                value={form.model}
                placeholder="gpt-4o-mini"
                onChange={(event) => setForm({ ...form, model: event.target.value })}
              />
              <FormError messages={error?.fields?.model} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="provider-temperature">Temperature</Label>
                <Input
                  id="provider-temperature"
                  type="number"
                  min={0}
                  max={2}
                  step={0.1}
                  value={form.temperature}
                  onChange={(event) => setForm({ ...form, temperature: event.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="provider-max-tokens">Max tokens</Label>
                <Input
                  id="provider-max-tokens"
                  type="number"
                  min={256}
                  max={32000}
                  value={form.maxTokens}
                  onChange={(event) => setForm({ ...form, maxTokens: event.target.value })}
                />
              </div>
            </div>

            {error ? (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error.message}
              </p>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" loading={pending}>
                Simpan
              </Button>
            </div>
          </form>
        ) : null}
      </Dialog>
    </div>
  );
}
