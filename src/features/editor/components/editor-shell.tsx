"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Canvas } from "@/features/editor/components/canvas";
import { EditorDnd } from "@/features/editor/components/dnd-provider";
import {
  ConflictDialog,
  SessionExpiredDialog,
  VersionsDialog,
} from "@/features/editor/components/editor-dialogs";
import { Inspector } from "@/features/editor/components/inspector";
import { Palette } from "@/features/editor/components/palette";
import { Toolbar } from "@/features/editor/components/toolbar";
import {
  createPageFromContentAction,
  forceSavePageContentAction,
  loadPageDocumentAction,
  loadVersionsAction,
  type VersionItemData,
} from "@/features/editor/actions";
import {
  EditorStoreProvider,
  useEditor,
  useEditorStoreApi,
} from "@/features/editor/store/editor-context";
import { savePageContentAction } from "@/features/pages/actions";
import type { BuilderDocument } from "@/features/editor/schemas/document";

export type EditorInitialData = {
  pageId: string;
  projectId: string;
  projectName: string;
  slug: string;
  title: string;
  document: BuilderDocument;
  revision: number;
  documentIsValid?: boolean;
};

export function EditorShell({ initial }: { initial: EditorInitialData }) {
  return (
    <EditorStoreProvider
      initial={{
        pageId: initial.pageId,
        projectId: initial.projectId,
        projectName: initial.projectName,
        slug: initial.slug,
        title: initial.title,
        document: initial.document,
        revision: initial.revision,
      }}
    >
      <EditorScreen documentIsValid={initial.documentIsValid ?? true} />
    </EditorStoreProvider>
  );
}

function EditorScreen({ documentIsValid }: { documentIsValid: boolean }) {
  const store = useEditorStoreApi();
  const editorDocument = useEditor((state) => state.document);
  const saveStatus = useEditor((state) => state.saveStatus);
  const conflict = useEditor((state) => state.conflict);
  const sessionExpired = useEditor((state) => state.sessionExpired);
  const pageId = useEditor((state) => state.pageId);
  const slug = useEditor((state) => state.slug);
  const title = useEditor((state) => state.title);

  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versions, setVersions] = useState<VersionItemData[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const saveNowRef = useRef<() => Promise<void>>(async () => {});
  const savingRef = useRef(false);
  const queuedRef = useRef(false);
  const retryRef = useRef(0);

  const saveNow = useCallback(async () => {
    if (savingRef.current) {
      queuedRef.current = true;
      return;
    }

    const state = store.getState();
    if (state.saveStatus === "saved") return;

    savingRef.current = true;
    state.markSaving();

    const result = await savePageContentAction({
      pageId: state.pageId,
      content: store.getState().document,
      baseRevision: store.getState().revision,
    });

    savingRef.current = false;

    if (result.ok) {
      store.getState().markSaved(result.data.revision);
      retryRef.current = 0;
      if (queuedRef.current) {
        queuedRef.current = false;
        void saveNowRef.current();
      }
      return;
    }

    if (result.error.code === "REVISION_CONFLICT") {
      store.getState().setConflict(true);
      return;
    }

    if (result.error.code === "UNAUTHENTICATED") {
      store.getState().setSessionExpired(true);
      store.getState().markError();
      return;
    }

    if (result.error.code === "VALIDATION") {
      const detail = Object.values(result.error.fieldErrors ?? {})[0]?.[0];
      toast.error(detail ?? result.error.message);
      store.getState().markError();
      return;
    }

    store.getState().markError();

    if (retryRef.current < 3) {
      const delay = 2000 * 2 ** retryRef.current;
      retryRef.current += 1;
      setTimeout(() => {
        void saveNowRef.current();
      }, delay);
    }
  }, [store]);

  useEffect(() => {
    saveNowRef.current = saveNow;
  }, [saveNow]);

  const refreshVersions = useCallback(async () => {
    setVersionsLoading(true);
    const result = await loadVersionsAction(store.getState().pageId);
    setVersionsLoading(false);

    if (result.ok) {
      setVersions(result.data);
      return;
    }
    toast.error(result.error.message);
  }, [store]);

  useEffect(() => {
    if (saveStatus !== "dirty") return;
    const timer = setTimeout(() => {
      void saveNowRef.current();
    }, 2000);
    return () => clearTimeout(timer);
  }, [editorDocument, saveStatus]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      const status = store.getState().saveStatus;
      if (status === "dirty" || status === "saving" || status === "error") {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [store]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;

      const state = store.getState();
      const modifier = event.ctrlKey || event.metaKey;

      if (modifier && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveNowRef.current();
        return;
      }

      if (isTyping) return;

      if (modifier && event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        state.undo();
        return;
      }

      if (
        modifier &&
        (event.key.toLowerCase() === "y" || (event.shiftKey && event.key.toLowerCase() === "z"))
      ) {
        event.preventDefault();
        state.redo();
        return;
      }

      if (modifier && event.key.toLowerCase() === "d") {
        event.preventDefault();
        if (state.selectedId) state.duplicateBlock(state.selectedId);
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        if (state.selectedId) {
          event.preventDefault();
          state.removeBlock(state.selectedId);
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [store]);

  async function handleExport() {
    setExporting(true);
    try {
      await saveNowNow();
      const state = store.getState();
      if (state.conflict || state.sessionExpired) return;

      const response = await fetch(`/api/pages/${state.pageId}/export`);
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null;
        toast.error(body?.error?.message ?? "Export gagal. Coba lagi.");
        return;
      }

      const blob = await response.blob();
      const fileUrl = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = fileUrl;
      link.download = `${state.slug}.html`;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(fileUrl);
      toast.success("HTML berhasil diunduh.");
    } catch {
      toast.error("Export gagal. Coba lagi.");
    } finally {
      setExporting(false);
    }
  }

  async function saveNowNow() {
    await saveNowRef.current();
  }

  async function handlePreview() {
    await saveNowNow();
    if (store.getState().conflict || store.getState().sessionExpired) return;
    window.open(`/editor/${pageId}/preview`, "_blank");
  }

  async function handleLoadLatest() {
    const result = await loadPageDocumentAction(pageId);
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    store.getState().replaceDocument(result.data.document as BuilderDocument, result.data.revision);
    toast.success("Versi terbaru dimuat.");
  }

  async function handleOverwrite() {
    const state = store.getState();
    const result = await forceSavePageContentAction({
      pageId: state.pageId,
      content: state.document,
    });
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    state.markSaved(result.data.revision);
    toast.success("Perubahan Anda disimpan.");
  }

  async function handleSaveCopy() {
    const state = store.getState();
    const result = await createPageFromContentAction({
      projectId: state.projectId,
      title: state.title,
      content: state.document,
    });
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Salinan halaman dibuat.");
    window.open(`/editor/${result.data.id}`, "_blank");
  }

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-center lg:hidden">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Editor butuh layar lebih lebar</h1>
          <p className="mt-2 text-sm text-slate-600">
            Buka editor di perangkat dengan lebar minimal 1024px untuk pengalaman terbaik.
          </p>
        </div>
      </div>

      <div className="hidden h-screen flex-col overflow-hidden lg:flex">
        {!documentIsValid ? (
          <div className="bg-amber-50 px-4 py-2 text-sm text-amber-800">
            Konten halaman sebelumnya rusak dan telah direset. Pulihkan dari riwayat versi bila perlu.
          </div>
        ) : null}

        <Toolbar
          onSave={() => void saveNowNow()}
          onPreview={() => void handlePreview()}
          onExport={() => void handleExport()}
          onOpenVersions={() => {
            setVersionsOpen(true);
            void refreshVersions();
          }}
          exporting={exporting}
        />

        <EditorDnd>
          <div className="flex flex-1 overflow-hidden">
            <Palette />
            <Canvas />
            <Inspector />
          </div>
        </EditorDnd>
      </div>

      <VersionsDialog
        open={versionsOpen}
        onClose={() => setVersionsOpen(false)}
        pageId={pageId}
        versions={versions}
        loading={versionsLoading}
        onRefresh={() => void refreshVersions()}
        onRestored={(nextDocument, revision) => {
          store.getState().replaceDocument(nextDocument as BuilderDocument, revision);
        }}
      />

      <ConflictDialog
        open={conflict && !sessionExpired}
        onLoadLatest={() => void handleLoadLatest()}
        onOverwrite={() => void handleOverwrite()}
        onSaveCopy={() => void handleSaveCopy()}
      />

      <SessionExpiredDialog
        open={sessionExpired}
        loginUrl={`/login?callbackUrl=${encodeURIComponent(`/editor/${pageId}`)}`}
        onRetry={() => {
          store.getState().setSessionExpired(false);
          void saveNowNow();
        }}
      />

      <span className="sr-only" aria-live="polite">
        {title} {slug}
      </span>
    </>
  );
}
