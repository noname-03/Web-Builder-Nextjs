"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormError, Input, Label, Textarea } from "@/components/ui/input";
import { saveTemplateAction } from "@/features/admin/actions";
import type { ActionError } from "@/lib/result";

type TemplateFormValue = {
  id: string;
  name: string;
  description: string | null;
  contentJson: string;
};

export function TemplateDialog({
  template,
  triggerLabel,
}: {
  template?: TemplateFormValue;
  triggerLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ActionError | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setPending(true);
    const result = await saveTemplateAction(null, formData);
    setPending(false);

    if (result.ok) {
      toast.success("Template disimpan.");
      setError(null);
      setOpen(false);
      return;
    }

    setError(result.error);
  }

  return (
    <>
      <Button
        size="sm"
        variant={template ? "secondary" : "primary"}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        {triggerLabel}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={template ? "Edit template" : "Template baru"}
        description="Konten diisi dengan JSON dokumen builder."
      >
        {open ? (
          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            {template ? <input type="hidden" name="templateId" value={template.id} /> : null}
            <div>
              <Label htmlFor={`template-name-${template?.id ?? "new"}`}>Nama</Label>
              <Input
                id={`template-name-${template?.id ?? "new"}`}
                name="name"
                defaultValue={template?.name ?? ""}
                maxLength={100}
                required
              />
              <FormError messages={error?.fieldErrors?.name} />
            </div>
            <div>
              <Label htmlFor={`template-description-${template?.id ?? "new"}`}>Deskripsi</Label>
              <Input
                id={`template-description-${template?.id ?? "new"}`}
                name="description"
                defaultValue={template?.description ?? ""}
                maxLength={300}
              />
            </div>
            <div>
              <Label htmlFor={`template-content-${template?.id ?? "new"}`}>Konten JSON</Label>
              <Textarea
                id={`template-content-${template?.id ?? "new"}`}
                name="content"
                defaultValue={template?.contentJson ?? ""}
                className="min-h-56 font-mono text-xs"
                required
              />
              <FormError messages={error?.fieldErrors?.content} />
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
                {pending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        ) : null}
      </Dialog>
    </>
  );
}
