import { nanoid } from "nanoid";
import { createStore, type StoreApi } from "zustand/vanilla";
import { createBlock } from "@/features/editor/blocks/registry";
import {
  cloneBlock,
  insertBlock,
  moveBlock,
  removeBlock,
  removeBlockStyle,
  updateBlockProps,
  updateBlockStyle,
  updateDocumentFonts,
  updateDocumentMeta,
} from "@/features/editor/lib/tree";
import type {
  BlockType,
  BuilderDocument,
  FontDefinition,
} from "@/features/editor/schemas/document";

export type Viewport = "desktop" | "tablet" | "mobile";
export type SaveStatus = "saved" | "dirty" | "saving" | "error";
export type EditorPanels = { palette: boolean; inspector: boolean };

const PANELS_STORAGE_KEY = "wb:editor-panels";

export function readPersistedPanels(): EditorPanels | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PANELS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<EditorPanels>;
    if (typeof parsed.palette !== "boolean" || typeof parsed.inspector !== "boolean") return null;
    return { palette: parsed.palette, inspector: parsed.inspector };
  } catch {
    return null;
  }
}

function persistPanels(panels: EditorPanels): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PANELS_STORAGE_KEY, JSON.stringify(panels));
  } catch {
    // Storage can be unavailable (private mode); preference simply won't persist.
  }
}

type EditorState = {
  pageId: string;
  projectId: string;
  projectName: string;
  slug: string;
  title: string;
  document: BuilderDocument;
  revision: number;
  selectedId: string | null;
  viewport: Viewport;
  saveStatus: SaveStatus;
  lastSavedAt: number | null;
  past: BuilderDocument[];
  future: BuilderDocument[];
  conflict: boolean;
  sessionExpired: boolean;
  panels: EditorPanels;

  selectBlock: (id: string | null) => void;
  togglePanel: (panel: keyof EditorPanels) => void;
  setPanels: (panels: EditorPanels) => void;
  applyDocument: (document: BuilderDocument) => void;
  setViewport: (viewport: Viewport) => void;
  insertBlock: (type: BlockType, parentId: string, index: number) => void;
  moveBlock: (blockId: string, parentId: string, index: number) => void;
  removeBlock: (blockId: string) => void;
  duplicateBlock: (blockId: string) => void;
  updateProps: (blockId: string, props: Record<string, unknown>) => void;
  updateStyle: (blockId: string, style: Record<string, string>) => void;
  clearStyle: (blockId: string, key: string) => void;
  updateMeta: (meta: Partial<BuilderDocument["meta"]>) => void;
  setFonts: (fonts: FontDefinition[]) => void;
  undo: () => void;
  redo: () => void;
  markSaving: () => void;
  markSaved: (revision: number) => void;
  markError: () => void;
  markDirty: () => void;
  setConflict: (value: boolean) => void;
  setSessionExpired: (value: boolean) => void;
  replaceDocument: (document: BuilderDocument, revision: number) => void;
  setTitle: (title: string) => void;
};

const HISTORY_LIMIT = 50;

export type EditorStoreApi = StoreApi<EditorState>;

export function createEditorStore(input: {
  pageId: string;
  projectId: string;
  projectName: string;
  slug: string;
  title: string;
  document: BuilderDocument;
  revision: number;
}): EditorStoreApi {
  return createStore<EditorState>()((set, get) => {
    const applyMutation = (mutate: (doc: BuilderDocument) => BuilderDocument) => {
      const state = get();
      const next = mutate(state.document);
      if (next === state.document) return;

      set({
        document: next,
        past: [...state.past, state.document].slice(-HISTORY_LIMIT),
        future: [],
        saveStatus: "dirty",
        conflict: false,
      });
    };

    return {
      pageId: input.pageId,
      projectId: input.projectId,
      projectName: input.projectName,
      slug: input.slug,
      title: input.title,
      document: input.document,
      revision: input.revision,
      selectedId: null,
      viewport: "desktop",
      saveStatus: "saved",
      lastSavedAt: null,
      past: [],
      future: [],
      conflict: false,
      sessionExpired: false,
      panels: { palette: true, inspector: true },

      selectBlock: (id) => set({ selectedId: id }),

      togglePanel: (panel) => {
        const next = { ...get().panels, [panel]: !get().panels[panel] };
        persistPanels(next);
        set({ panels: next });
      },

      setPanels: (panels) => set({ panels }),

      applyDocument: (document) => {
        const state = get();
        set({
          document,
          past: [...state.past, state.document].slice(-HISTORY_LIMIT),
          future: [],
          saveStatus: "dirty",
          selectedId: null,
          conflict: false,
        });
      },
      setViewport: (viewport) => set({ viewport }),
      setTitle: (title) => set({ title }),

      insertBlock: (type, parentId, index) => {
        applyMutation((doc) => insertBlock(doc, { parentId, index, block: createBlock(type, nanoid(10)) }));
      },

      moveBlock: (blockId, parentId, index) => {
        applyMutation((doc) => moveBlock(doc, { blockId, parentId, index }));
      },

      removeBlock: (blockId) => {
        applyMutation((doc) => removeBlock(doc, blockId));
        if (get().selectedId === blockId) set({ selectedId: null });
      },

      duplicateBlock: (blockId) => {
        applyMutation((doc) => cloneBlock(doc, blockId, () => nanoid(10)));
      },

      updateProps: (blockId, props) => applyMutation((doc) => updateBlockProps(doc, blockId, props)),
      updateStyle: (blockId, style) => applyMutation((doc) => updateBlockStyle(doc, blockId, style)),
      clearStyle: (blockId, key) => applyMutation((doc) => removeBlockStyle(doc, blockId, key)),
      updateMeta: (meta) => applyMutation((doc) => updateDocumentMeta(doc, meta)),
      setFonts: (fonts) => applyMutation((doc) => updateDocumentFonts(doc, fonts)),

      undo: () => {
        const state = get();
        const previous = state.past[state.past.length - 1];
        if (!previous) return;
        set({
          document: previous,
          past: state.past.slice(0, -1),
          future: [state.document, ...state.future].slice(0, HISTORY_LIMIT),
          saveStatus: "dirty",
          selectedId: null,
        });
      },

      redo: () => {
        const state = get();
        const next = state.future[0];
        if (!next) return;
        set({
          document: next,
          past: [...state.past, state.document].slice(-HISTORY_LIMIT),
          future: state.future.slice(1),
          saveStatus: "dirty",
          selectedId: null,
        });
      },

      markSaving: () => set({ saveStatus: "saving" }),
      markSaved: (revision) => set({ saveStatus: "saved", revision, lastSavedAt: Date.now() }),
      markError: () => set({ saveStatus: "error" }),
      markDirty: () => set((state) => (state.saveStatus === "saving" ? state : { saveStatus: "dirty" })),
      setConflict: (value) => set({ conflict: value }),
      setSessionExpired: (value) => set({ sessionExpired: value }),

      replaceDocument: (document, revision) =>
        set({
          document,
          revision,
          past: [],
          future: [],
          saveStatus: "saved",
          conflict: false,
          selectedId: null,
        }),
    };
  });
}
