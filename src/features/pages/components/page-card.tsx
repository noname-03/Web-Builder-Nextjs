"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormError, Input, Label } from "@/components/ui/input";
import {
  deletePageAction,
  duplicatePageAction,
  renamePageAction,
} from "@/features/pages/actions";

type PageCardProps = {
  page: {
    id: string;
    title: string;
    slug: string;
    status: "DRAFT" | "READY";
    updatedAt: string;
  };
};

export function PageCard({ page }: PageCardProps) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [title, setTitle] = useState(page.title);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  async function handleRename() {
    setPending(true);
    const result = await renamePageAction({ pageId: page.id, title });
    setPending(false);

    if (result.ok) {
      toast.success("Judul halaman diperbarui.");
      setRenameOpen(false);
      setFieldError(undefined);
      return;
    }
    setFieldError(result.error.fieldErrors?.title?.[0] ?? result.error.message);
  }

  async function handleDuplicate() {
    setPending(true);
    const result = await duplicatePageAction(page.id);
    setPending(false);

    if (result.ok) {
      toast.success("Halaman diduplikasi.");
      return;
    }
    toast.error(result.error.message);
  }

  async function handleDelete() {
    setPending(true);
    const result = await deletePageAction(page.id);
    setPending(false);

    if (result.ok) {
      toast.success("Halaman dihapus.");
      setDeleteOpen(false);
      return;
    }
    toast.error(result.error.message);
  }

  return (
    <Card className="flex flex-col p-4">
      <Link href={`/editor/${page.id}`} className="flex-1">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900">{page.title}</h2>
          <Badge tone={page.status === "READY" ? "success" : "neutral"}>
            {page.status === "READY" ? "Siap" : "Draft"}
          </Badge>
        </div>
        <p className="mt-1 text-xs text-slate-500">/{page.slug}</p>
        <p className="mt-3 text-xs text-slate-500">Diperbarui {formatDate(page.updatedAt)}</p>
      </Link>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/editor/${page.id}`}
          className="inline-flex h-9 items-center rounded-md bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-700"
        >
          Edit
        </Link>
        <Button size="sm" variant="secondary" onClick={() => setRenameOpen(true)}>
          Ubah judul
        </Button>
        <Button size="sm" variant="secondary" loading={pending} onClick={handleDuplicate}>
          Duplikat
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setDeleteOpen(true)}>
          Hapus
        </Button>
      </div>

      <Dialog open={renameOpen} onClose={() => setRenameOpen(false)} title="Ubah judul halaman">
        <div className="space-y-3">
          <div>
            <Label htmlFor={`rename-page-${page.id}`}>Judul</Label>
            <Input
              id={`rename-page-${page.id}`}
              value={title}
              maxLength={150}
              onChange={(event) => setTitle(event.target.value)}
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
        title="Hapus halaman?"
        description="Halaman tidak akan tampil lagi di project ini."
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
            Batal
          </Button>
          <Button variant="danger" loading={pending} onClick={handleDelete}>
            Hapus halaman
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
