"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { clsx } from "clsx";
import { Fragment, useState } from "react";
import { BLOCK_DEFINITIONS } from "@/features/editor/blocks/registry";
import { BlockContent } from "@/features/editor/blocks/block-content";
import { findParentId } from "@/features/editor/lib/tree";
import { isContainerType, type BlockType } from "@/features/editor/schemas/document";
import { useEditor, useEditorStoreApi } from "@/features/editor/store/editor-context";
import type { Viewport } from "@/features/editor/store/editor-store";

type DragData =
  | { source: "palette"; blockType: BlockType }
  | { source: "canvas"; blockId: string };

type DropData = { parentId: string; index: number };

const VIEWPORT_WIDTH: Record<Viewport, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

export function Canvas() {
  const store = useEditorStoreApi();
  const document = useEditor((state) => state.document);
  const viewport = useEditor((state) => state.viewport);
  const selectBlock = useEditor((state) => state.selectBlock);
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
    if (data.source === "palette") {
      state.insertBlock(data.blockType, target.parentId, target.index);
    } else {
      state.moveBlock(data.blockId, target.parentId, target.index);
    }
  }

  return (
    <div className="flex-1 overflow-auto bg-slate-100 p-4" onClick={() => selectBlock(null)}>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="mx-auto transition-[width] duration-200" style={{ width: VIEWPORT_WIDTH[viewport], maxWidth: "100%" }}>
          <div className="min-h-[60vh] rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <BlockNode id={document.rootId} />
          </div>
        </div>

        <DragOverlay>
          {activeLabel ? (
            <div className="rounded-md border border-blue-400 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-lg">
              {activeLabel}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function BlockNode({ id }: { id: string }) {
  const block = useEditor((state) => state.document.blocks[id]);
  const document = useEditor((state) => state.document);
  const selectedId = useEditor((state) => state.selectedId);
  const selectBlock = useEditor((state) => state.selectBlock);
  const removeBlock = useEditor((state) => state.removeBlock);
  const duplicateBlock = useEditor((state) => state.duplicateBlock);
  const moveBlock = useEditor((state) => state.moveBlock);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `block:${id}`,
    data: { source: "canvas", blockId: id },
    disabled: id === document.rootId,
  });

  if (!block) return null;

  const selected = selectedId === id;
  const isRoot = id === document.rootId;
  const definition = BLOCK_DEFINITIONS[block.type];

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }}
      onClick={(event) => {
        event.stopPropagation();
        selectBlock(id);
      }}
      className={clsx(
        "group relative rounded-sm",
        selected ? "outline outline-2 outline-blue-500 outline-offset-2" : "hover:outline hover:outline-1 hover:outline-blue-300",
      )}
    >
      {!isRoot ? (
        <div
          className={clsx(
            "absolute -top-7 left-0 z-10 hidden items-center gap-1 rounded-md border border-slate-200 bg-white px-1 py-0.5 text-xs shadow-sm group-hover:flex",
            selected && "flex",
          )}
        >
          <button
            type="button"
            {...listeners}
            {...attributes}
            aria-label="Pindahkan blok"
            className="cursor-grab rounded px-1 py-0.5 hover:bg-slate-100"
          >
            ⋮⋮
          </button>
          <span className="px-1 text-slate-500">{definition.label}</span>
          <button
            type="button"
            aria-label="Duplikat blok"
            onClick={(event) => {
              event.stopPropagation();
              duplicateBlock(id);
            }}
            className="rounded px-1 py-0.5 hover:bg-slate-100"
          >
            ⧉
          </button>
          <button
            type="button"
            aria-label="Naikkan blok"
            onClick={(event) => {
              event.stopPropagation();
              const parentId = findParentId(document, id);
              if (!parentId) return;
              const parent = document.blocks[parentId];
              if (!parent) return;
              const index = parent.children.indexOf(id);
              if (index > 0) moveBlock(id, parentId, index - 1);
            }}
            className="rounded px-1 py-0.5 hover:bg-slate-100"
          >
            ↑
          </button>
          <button
            type="button"
            aria-label="Turunkan blok"
            onClick={(event) => {
              event.stopPropagation();
              const parentId = findParentId(document, id);
              if (!parentId) return;
              const parent = document.blocks[parentId];
              if (!parent) return;
              const index = parent.children.indexOf(id);
              if (index < parent.children.length - 1) moveBlock(id, parentId, index + 2);
            }}
            className="rounded px-1 py-0.5 hover:bg-slate-100"
          >
            ↓
          </button>
          <button
            type="button"
            aria-label="Hapus blok"
            onClick={(event) => {
              event.stopPropagation();
              removeBlock(id);
            }}
            className="rounded px-1 py-0.5 text-red-600 hover:bg-red-50"
          >
            ✕
          </button>
        </div>
      ) : null}

      <BlockContent block={block}>
        {isContainerType(block.type) ? <ChildrenList parentId={id} /> : null}
      </BlockContent>
    </div>
  );
}

function ChildrenList({ parentId }: { parentId: string }) {
  const block = useEditor((state) => state.document.blocks[parentId]);
  if (!block) return null;

  return (
    <>
      {block.children.length === 0 ? (
        <DropGap parentId={parentId} index={0} empty />
      ) : (
        <>
          {block.children.map((childId, index) => (
            <Fragment key={childId}>
              <DropGap parentId={parentId} index={index} />
              <BlockNode id={childId} />
            </Fragment>
          ))}
          <DropGap parentId={parentId} index={block.children.length} />
        </>
      )}
    </>
  );
}

function DropGap({
  parentId,
  index,
  empty = false,
}: {
  parentId: string;
  index: number;
  empty?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `gap:${parentId}:${index}`,
    data: { parentId, index },
  });

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "rounded transition-all",
        empty
          ? "flex min-h-16 items-center justify-center border border-dashed border-slate-300 text-xs text-slate-400"
          : "h-1.5",
        isOver && (empty ? "border-blue-500 bg-blue-50 text-blue-600" : "h-6 bg-blue-100"),
      )}
    >
      {empty ? "Tarik blok ke sini" : null}
    </div>
  );
}
