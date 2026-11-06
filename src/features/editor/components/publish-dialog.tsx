"use client";

import { useState } from "react";
import { toast } from "sonner";
import { clsx } from "clsx";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { publishPageAction, unpublishPageAction } from "@/features/pages/actions";

export type PublishState = { isPublished: boolean; publicSlug: string | null };

export type PublishDialogProps = {
  open: boolean;
  onClose: () => void;
  pageId: string;
  initialPublicSlug: string | null;
  initialIsPublished: boolean;
  onPublishStateChange: (state: PublishState) => void;
};

function buildPublicUrl(publicSlug: string | null): string {
  if (!publicSlug) return "";
  const path = `/pages/${publicSlug}`;
  // Origin is only available in the browser; SSR falls back to the relative path.
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

export function PublishDialog({
  open,
  onClose,
  pageId,
  initialPublicSlug,
  initialIsPublished,
  onPublishStateChange,
}: PublishDialogProps) {
  // Local override reflects the result of publish/unpublish without mirroring props in effects.
  const [override, setOverride] = useState<PublishState | null>(null);
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPublished = override ? override.isPublished : initialIsPublished;
  const publicSlug = override ? override.publicSlug : initialPublicSlug;
  const publicUrl = buildPublicUrl(publicSlug);

  function handleClose() {
    if (pending) return;
    setOverride(null);
    setErrorMessage(null);
    onClose();
  }

  async function handleCopy() {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success("URL publik disalin.");
    } catch {
      toast.error("Gagal menyalin URL. Salin manual dari kolom URL.");
    }
  }

  async function handlePublish() {
    setPending(true);
    setErrorMessage(null);
    const result = await publishPageAction(pageId);
    setPending(false);

    if (!result.ok) {
      setErrorMessage(result.error.message);
      return;
    }

    setOverride({ isPublished: true, publicSlug: result.data.publicSlug });
    onPublishStateChange({ isPublished: true, publicSlug: result.data.publicSlug });
    toast.success("Halaman dipublikasikan.");
  }

  async function handleUnpublish() {
    const confirmed = window.confirm(
      "Batalkan publikasi halaman ini? Tautan publik tidak dapat diakses lagi sampai dipublikasikan ulang.",
    );
    if (!confirmed) return;

    setPending(true);
    setErrorMessage(null);
    const result = await unpublishPageAction(pageId);
    setPending(false);

    if (!result.ok) {
      setErrorMessage(result.error.message);
      return;
    }

    setOverride({ isPublished: false, publicSlug });
    onPublishStateChange({ isPublished: false, publicSlug });
    toast.success("Publikasi dibatalkan. Halaman kembali menjadi draft.");
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Publish halaman"
      description="Bagikan halaman ini lewat tautan publik."
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={pending}>
            Tutup
          </Button>
          {isPublished ? (
            <Button
              variant="danger"
              loading={pending}
              data-testid="publish-unpublish"
              onClick={() => void handleUnpublish()}
            >
              Unpublish
            </Button>
          ) : (
            <Button
              loading={pending}
              data-testid="publish-submit"
              onClick={() => void handlePublish()}
            >
              Publish sekarang
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Status:</span>
          <span
            data-testid="publish-status"
            className={clsx(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
              isPublished ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700",
            )}
          >
            {isPublished ? "Published" : "Draft"}
          </span>
        </div>

        {publicSlug ? (
          <div className="space-y-2">
            <label htmlFor="publish-url" className="block text-sm font-medium text-slate-800">
              URL publik
            </label>
            <div className="flex flex-wrap gap-2">
              <input
                id="publish-url"
                data-testid="publish-url"
                readOnly
                value={publicUrl}
                onFocus={(event) => event.currentTarget.select()}
                className="h-10 min-w-0 flex-1 rounded-md border border-slate-300 bg-slate-50 px-3 text-sm text-slate-800"
              />
              <Button
                variant="secondary"
                data-testid="publish-copy-url"
                onClick={() => void handleCopy()}
              >
                Salin URL
              </Button>
            </div>
            {!isPublished ? (
              <p className="text-xs text-slate-500">
                Tautan ini baru aktif setelah halaman dipublikasikan.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            Halaman ini belum pernah dipublikasikan, jadi belum punya URL publik.
          </p>
        )}

        {isPublished ? (
          <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
            Halaman sudah dapat diakses publik lewat tautan di atas.
          </p>
        ) : (
          <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
            Setelah dipublikasikan, siapa pun yang memiliki tautan dapat melihat halaman ini tanpa
            perlu masuk.
          </p>
        )}

        {errorMessage ? (
          <p data-testid="publish-error" role="alert" className="text-sm font-medium text-red-600">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}
