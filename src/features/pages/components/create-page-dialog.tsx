"use client";

import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormError, Input, Label } from "@/components/ui/input";
import { createPageAction } from "@/features/pages/actions";
import { UNKNOWN_TEMPLATE_META, getTemplateMeta } from "@/features/templates/template-meta";
import { TemplateThumbnail } from "@/features/templates/template-thumbnail";
import type { ActionError } from "@/lib/result";

type Template = { id: string; name: string; description: string | null };

function TemplateCard({
  name,
  description,
  accentFallback,
  selected,
  disabled,
  badge,
  onSelect,
}: {
  name: string;
  description: string | null;
  accentFallback: string;
  selected: boolean;
  disabled: boolean;
  badge?: string;
  onSelect: () => void;
}) {
  const meta = getTemplateMeta(name);
  const featured = meta.isFeatured;

  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
      className={clsx(
        "flex h-full flex-col gap-2 rounded-lg border p-2 text-left transition-colors",
        selected
          ? "border-blue-500 ring-2 ring-blue-500"
          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <TemplateThumbnail meta={meta} name={name} />
      <span className="flex items-start justify-between gap-2">
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-slate-900">{name}</span>
          <span className="mt-1 flex flex-wrap items-center gap-1">
            <span
              className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{ backgroundColor: `${accentFallback}1f`, color: accentFallback }}
            >
              {badge ?? meta.category}
            </span>
            {featured ? (
              <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                Unggulan
              </span>
            ) : null}
          </span>
        </span>
        {selected ? (
          <span
            aria-hidden="true"
            className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white"
          >
            ✓
          </span>
        ) : null}
      </span>
      <span className="text-xs leading-relaxed text-slate-500">
        {description || "Template siap pakai."}
      </span>
    </button>
  );
}

export function CreatePageDialog({
  projectId,
  templates,
}: {
  projectId: string;
  templates: Template[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ActionError | null>(null);
  const [templateId, setTemplateId] = useState("");
  const router = useRouter();
  const selectedTemplate = templates.find((template) => template.id === templateId);
  const orderedTemplates = [...templates].sort(
    (left, right) => getTemplateMeta(left.name).sortOrder - getTemplateMeta(right.name).sortOrder,
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setPending(true);
    const result = await createPageAction(null, formData);
    setPending(false);

    if (result.ok) {
      toast.success("Halaman dibuat.");
      setError(null);
      setOpen(false);
      router.push(`/editor/${result.data.id}`);
      return;
    }

    setError(result.error);
  }

  return (
    <>
      <Button
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        Page Baru
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Page Baru"
        description="Mulai dari halaman kosong atau gunakan template."
      >
        {open ? (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <input type="hidden" name="projectId" value={projectId} />
            <div>
              <Label htmlFor="page-title">Judul halaman</Label>
              <Input id="page-title" name="title" maxLength={150} required />
              <FormError messages={error?.fieldErrors?.title} />
            </div>
            <div>
              <span id="page-template-label" className="mb-1 block text-sm font-medium text-slate-700">
                Pilih template
              </span>
              <input type="hidden" name="templateId" value={templateId} />
              <div
                role="group"
                aria-labelledby="page-template-label"
                className="grid max-h-[46vh] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2"
              >
                <TemplateCard
                  name="Mulai kosong"
                  description="Kanvas kosong tanpa blok, siap kamu susun sendiri."
                  accentFallback={UNKNOWN_TEMPLATE_META.accentColor}
                  badge="Kosong"
                  selected={templateId === ""}
                  disabled={pending}
                  onSelect={() => setTemplateId("")}
                />
                {orderedTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    name={template.name}
                    description={template.description}
                    accentFallback={getTemplateMeta(template.name).accentColor}
                    selected={templateId === template.id}
                    disabled={pending}
                    onSelect={() => setTemplateId(template.id)}
                  />
                ))}
              </div>
              <p className="mt-1 min-h-4 text-xs text-slate-500">
                {selectedTemplate?.description || "Mulai dari kanvas kosong."}
              </p>
              <FormError messages={error?.fieldErrors?.templateId} />
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
                {pending ? "Membuat..." : "Buat halaman"}
              </Button>
            </div>
          </form>
        ) : null}
      </Dialog>
    </>
  );
}
