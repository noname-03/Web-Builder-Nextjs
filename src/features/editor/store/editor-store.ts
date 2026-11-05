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
  updateDocumentMeta,
} from "@/features/editor/lib/tree";
import type { BlockType, BuilderDocument } from "@/features/editor/schemas/document";

export type Viewport = "desktop" | "tablet" | "mobile";
export type SaveStatus = "saved" | "dirty" | "saving" | "error";

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

  selectBlock: (id: string | null) => void;
  setViewport: (viewport: Viewport) => void;
  insertBlock: (type: BlockType, parentId: string, index: number) => void;
  moveBlock: (blockId: string, parentId: string, index: number) => void;
  removeBlock: (blockId: string) => void;
  duplicateBlock: (blockId: string) => void;
  updateProps: (blockId: string, props: Record<string, unknown>) => void;
  updateStyle: (blockId: string, style: Record<string, string>) => void;
  clearStyle: (blockId: string, key: string) => void;
  updateMeta: (meta: Partial<BuilderDocument["meta"]>) => void;
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

      selectBlock: (id) => set({ selectedId: id }),
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
