"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useState } from "react";
import { BLOCK_DEFINITIONS } from "@/features/editor/blocks/registry";
import { isAllowedChild } from "@/features/editor/lib/tree";
import { isContainerType, type BlockType } from "@/features/editor/schemas/document";
import { useEditorStoreApi } from "@/features/editor/store/editor-context";

export type DragData =
  | { source: "palette"; blockType: BlockType }
  | { source: "canvas"; blockId: string };

export type DropData =
  | { kind: "gap"; parentId: string; index: number }
  | { kind: "block"; blockId: string; parentId: string | null; index: number };

export function EditorDnd({ children }: { children: React.ReactNode }) {
  const store = useEditorStoreApi();
  const [activeLabel, setActiveLabel] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as DragData | undefined;
    if (!data) return;

    if (data.source === "palette") {
      setActiveLabel(BLOCK_DEFINITIONS[data.blockType].label);
      return;
    }

    const block = store.getState().document.blocks[data.blockId];
    setActiveLabel(block ? BLOCK_DEFINITIONS[block.type].label : "Blok");
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveLabel(null);
    const data = event.active.data.current as DragData | undefined;
    const target = event.over?.data.current as DropData | undefined;
    if (!data || !target) return;

    const state = store.getState();
    const draggedBlock = data.source === "canvas" ? state.document.blocks[data.blockId] : undefined;
    const draggedType = data.source === "palette" ? data.blockType : draggedBlock?.type;
    if (!draggedType) return;

    let parentId: string | null = null;
    let index = 0;

    if (target.kind === "gap") {
      parentId = target.parentId;
      index = target.index;
    } else {
      const targetBlock = state.document.blocks[target.blockId];

      if (targetBlock && isContainerType(targetBlock.type)) {
        if (!isAllowedChild(targetBlock.type, draggedType)) {
          if (!target.parentId) return;
          parentId = target.parentId;
          index = target.index;
        } else {
          parentId = targetBlock.id;
          index = targetBlock.children.length;
        }
      } else if (target.parentId) {
        parentId = target.parentId;
        index = target.index;
      }
    }

    if (!parentId) return;

    if (data.source === "palette") {
      state.insertBlock(data.blockType, parentId, index);
      return;
    }
    state.moveBlock(data.blockId, parentId, index);
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {children}
      <DragOverlay>
        {activeLabel ? (
          <div className="rounded-md border border-blue-400 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-lg">
            {activeLabel}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
