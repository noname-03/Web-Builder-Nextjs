"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormError, Input, Label, Textarea } from "@/components/ui/input";
import { createProjectAction } from "@/features/projects/actions";
import type { ActionError } from "@/lib/result";

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ActionError | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setPending(true);
    const result = await createProjectAction(null, formData);
    setPending(false);

    if (result.ok) {
      toast.success("Project berhasil dibuat.");
      setError(null);
      setOpen(false);
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
        Project Baru
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Project Baru"
        description="Project adalah wadah untuk kumpulan halaman."
      >
        {open ? (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <Label htmlFor="project-name">Nama project</Label>
              <Input id="project-name" name="name" maxLength={100} required />
              <FormError messages={error?.fieldErrors?.name} />
            </div>
            <div>
              <Label htmlFor="project-description">Deskripsi (opsional)</Label>
              <Textarea id="project-description" name="description" maxLength={500} />
              <FormError messages={error?.fieldErrors?.description} />
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
