"use client";

import { useEffect, useRef } from "react";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function Dialog({ open, onClose, title, description, children, footer }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (open && !element.open) {
      element.showModal();
    } else if (!open && element.open) {
      element.close();
    }
  }, [open]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };

    element.addEventListener("cancel", handleCancel);
    return () => element.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="dialog-title"
      className="m-auto max-h-[90vh] w-[min(92vw,34rem)] overflow-y-auto rounded-lg border border-slate-200 bg-white p-0 text-slate-900 shadow-xl"
    >
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 id="dialog-title" className="text-lg font-semibold">
            {title}
          </h2>
          {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup dialog"
          className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        >
          ✕
        </button>
      </div>
      <div className="px-5 py-4">{children}</div>
      {footer ? <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">{footer}</div> : null}
    </dialog>
  );
}
