"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormError, Input, Label, Select } from "@/components/ui/input";
import { createPageAction } from "@/features/pages/actions";
import type { ActionError } from "@/lib/result";

type Template = { id: string; name: string; description: string | null };

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
  const router = useRouter();

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
              <Label htmlFor="page-template">Template</Label>
              <Select id="page-template" name="templateId" defaultValue="">
                <option value="">Halaman kosong</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </Select>
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
