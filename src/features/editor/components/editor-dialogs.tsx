"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  createManualSnapshotAction,
  restoreVersionAction,
  type VersionItemData,
} from "@/features/editor/actions";

const SOURCE_LABEL: Record<string, string> = {
  MANUAL: "Manual",
  EXPORT: "Export",
  RESTORE: "Restore",
};

export function VersionsDialog({
  open,
  onClose,
  pageId,
  versions,
  loading,
  onRefresh,
  onRestored,
}: {
  open: boolean;
  onClose: () => void;
  pageId: string;
  versions: VersionItemData[];
  loading: boolean;
  onRefresh: () => void;
  onRestored: (document: unknown, revision: number) => void;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleSnapshot() {
    const result = await createManualSnapshotAction(pageId);
    if (result.ok) {
      toast.success("Versi tersimpan.");
      onRefresh();
      return;
    }
    toast.error(result.error.message);
  }

  async function handleRestore(versionId: string) {
    setPendingId(versionId);
    const result = await restoreVersionAction({ pageId, versionId });
    setPendingId(null);

    if (result.ok) {
      onRestored(result.data.document, result.data.revision);
      toast.success("Versi dipulihkan.");
      onClose();
      return;
    }
    toast.error(result.error.message);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Riwayat versi"
      description="Simpan snapshot atau pulihkan konten sebelumnya."
      footer={
        <Button variant="secondary" onClick={handleSnapshot}>
          Simpan versi sekarang
        </Button>
      }
    >
      {loading ? (
        <p className="text-sm text-slate-500">Memuat versi...</p>
      ) : versions.length === 0 ? (
        <p className="text-sm text-slate-500">Belum ada versi tersimpan.</p>
      ) : (
        <ul className="max-h-80 space-y-2 overflow-y-auto">
          {versions.map((version) => (
            <li
              key={version.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 p-2"
            >
              <div>
                <p className="text-sm font-medium text-slate-800">
                  Rev {version.revision} · {SOURCE_LABEL[version.source] ?? version.source}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(version.createdAt).toLocaleString("id-ID")}
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                loading={pendingId === version.id}
                onClick={() => handleRestore(version.id)}
              >
                Restore
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}

export function ConflictDialog({
  open,
  onLoadLatest,
  onOverwrite,
  onSaveCopy,
}: {
  open: boolean;
  onLoadLatest: () => void;
  onOverwrite: () => void;
  onSaveCopy: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onLoadLatest}
      title="Halaman diubah di tempat lain"
      description="Perubahan Anda belum tersimpan. Pilih cara menyelesaikannya."
    >
      <div className="space-y-2">
        <Button className="w-full" variant="secondary" onClick={onLoadLatest}>
          Muat versi terbaru (buang perubahan saya)
        </Button>
        <Button className="w-full" variant="secondary" onClick={onOverwrite}>
          Timpa dengan versi saya
        </Button>
        <Button className="w-full" variant="secondary" onClick={onSaveCopy}>
          Simpan salinan sebagai halaman baru
        </Button>
      </div>
    </Dialog>
  );
}

export function SessionExpiredDialog({
  open,
  loginUrl,
  onRetry,
}: {
  open: boolean;
  loginUrl: string;
  onRetry: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onRetry}
      title="Sesi berakhir"
      description="Perubahan Anda masih ada di editor. Masuk lagi lalu coba simpan."
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={() => window.open(loginUrl, "_blank")}>
          Masuk lagi
        </Button>
        <Button onClick={onRetry}>Coba simpan lagi</Button>
      </div>
    </Dialog>
  );
}
