"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { FormError, Input, Label } from "@/components/ui/input";
import { deleteProjectAction, renameProjectAction } from "@/features/projects/actions";

type ProjectCardProps = {
  project: {
    id: string;
    name: string;
    description: string | null;
    pageCount: number;
    updatedAt: string;
  };
};

export function ProjectCard({ project }: ProjectCardProps) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState(project.name);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  async function handleRename() {
    setPending(true);
    const result = await renameProjectAction({ projectId: project.id, name });
    setPending(false);

    if (result.ok) {
      toast.success("Nama project diperbarui.");
      setRenameOpen(false);
      setFieldError(undefined);
      return;
    }
    setFieldError(result.error.fieldErrors?.name?.[0] ?? result.error.message);
  }

  async function handleDelete() {
    setPending(true);
    const result = await deleteProjectAction(project.id);
    setPending(false);

    if (result.ok) {
      toast.success("Project dihapus.");
      setDeleteOpen(false);
      return;
    }
    toast.error(result.error.message);
  }

  return (
    <Card className="flex flex-col p-4">
      <Link href={`/dashboard/projects/${project.id}`} className="flex-1">
        <h2 className="text-base font-semibold text-slate-900">{project.name}</h2>
        <p className="mt-1 line-clamp-2 text-sm text-slate-600">
          {project.description || "Tanpa deskripsi"}
        </p>
        <p className="mt-3 text-xs text-slate-500">
          {project.pageCount} halaman · diperbarui {formatDate(project.updatedAt)}
        </p>
      </Link>

      <div className="mt-4 flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => setRenameOpen(true)}>
          Ubah nama
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setDeleteOpen(true)}>
          Hapus
        </Button>
      </div>

      <Dialog open={renameOpen} onClose={() => setRenameOpen(false)} title="Ubah nama project">
        <div className="space-y-3">
          <div>
            <Label htmlFor={`rename-${project.id}`}>Nama project</Label>
            <Input
              id={`rename-${project.id}`}
              value={name}
              maxLength={100}
              onChange={(event) => setName(event.target.value)}
            />
            <FormError messages={fieldError ? [fieldError] : undefined} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRenameOpen(false)}>
              Batal
            </Button>
            <Button loading={pending} onClick={handleRename}>
              Simpan
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Hapus project?"
        description="Semua halaman di dalam project ini tidak akan tampil lagi."
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
            Batal
          </Button>
          <Button variant="danger" loading={pending} onClick={handleDelete}>
            Hapus project
          </Button>
        </div>
      </Dialog>
    </Card>
  );
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
