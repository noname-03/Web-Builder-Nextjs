"use client";

import { createContext, useContext, useState } from "react";
import { useStore } from "zustand";
import { createEditorStore, type EditorStoreApi } from "@/features/editor/store/editor-store";

const EditorStoreContext = createContext<EditorStoreApi | null>(null);

export function EditorStoreProvider({
  initial,
  children,
}: {
  initial: Parameters<typeof createEditorStore>[0];
  children: React.ReactNode;
}) {
  const [store] = useState(() => createEditorStore(initial));

  return <EditorStoreContext.Provider value={store}>{children}</EditorStoreContext.Provider>;
}

export function useEditorStoreApi(): EditorStoreApi {
  const store = useContext(EditorStoreContext);
  if (!store) throw new Error("EditorStoreProvider tidak ditemukan.");
  return store;
}

export function useEditor<T>(selector: (state: ReturnType<EditorStoreApi["getState"]>) => T): T {
  const store = useEditorStoreApi();
  return useStore(store, selector);
}
