"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { clsx } from "clsx";
import { Fragment } from "react";
import { BlockContent } from "@/features/editor/blocks/block-content";
import { BLOCK_DEFINITIONS } from "@/features/editor/blocks/registry";
import { findParentId } from "@/features/editor/lib/tree";
import { isContainerType } from "@/features/editor/schemas/document";
import { useEditor } from "@/features/editor/store/editor-context";
import type { Viewport } from "@/features/editor/store/editor-store";

const VIEWPORT_WIDTH: Record<Viewport, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

export function Canvas() {
  const document = useEditor((state) => state.document);
  const viewport = useEditor((state) => state.viewport);
  const selectBlock = useEditor((state) => state.selectBlock);

  return (
    <div className="flex-1 overflow-auto bg-slate-100 p-4" onClick={() => selectBlock(null)}>
      <div
        className="mx-auto transition-[width] duration-200"
        style={{ width: VIEWPORT_WIDTH[viewport], maxWidth: "100%" }}
      >
        <div className="min-h-[60vh] rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <BlockNode id={document.rootId} />
        </div>
      </div>
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

  const parentId = findParentId(document, id);
  const parent = parentId ? document.blocks[parentId] : undefined;
  const index = parent ? parent.children.indexOf(id) : 0;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `block:${id}`,
    data: { source: "canvas", blockId: id },
    disabled: id === document.rootId,
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-block:${id}`,
    data: { kind: "block", blockId: id, parentId, index },
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
      className={clsx("group relative rounded-sm", isDragging && "z-20")}
    >
      {!isRoot ? (
        <button
          type="button"
          {...listeners}
          {...attributes}
          aria-label="Pindahkan blok"
          title="Tarik untuk memindahkan blok"
          className="absolute -left-2 top-1 z-10 cursor-grab rounded border border-slate-200 bg-white px-1 py-0.5 text-[10px] leading-3 text-slate-400 opacity-40 hover:opacity-100 group-hover:opacity-100"
        >
          ⋮⋮
        </button>
      ) : null}

      <div
        ref={setDropRef}
        className={clsx(
          "rounded-sm transition-shadow",
          selected
            ? "outline outline-2 outline-blue-500 outline-offset-2"
            : "hover:outline hover:outline-1 hover:outline-blue-300",
          isOver && !isDragging && "ring-2 ring-blue-400 ring-offset-2",
        )}
      >
        <BlockContent block={block}>
          {isContainerType(block.type) ? <ChildrenList parentId={id} /> : null}
        </BlockContent>
      </div>

      {!isRoot ? (
        <div
          className={clsx(
            "absolute -top-7 left-0 z-10 hidden items-center gap-1 rounded-md border border-slate-200 bg-white px-1 py-0.5 text-xs shadow-sm group-hover:flex",
            selected && "flex",
          )}
        >
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
              if (!parentId || !parent) return;
              const currentIndex = parent.children.indexOf(id);
              if (currentIndex > 0) moveBlock(id, parentId, currentIndex - 1);
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
              if (!parentId || !parent) return;
              const currentIndex = parent.children.indexOf(id);
              if (currentIndex < parent.children.length - 1) moveBlock(id, parentId, currentIndex + 2);
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
    </div>
  );
}

function ChildrenList({ parentId }: { parentId: string }) {
  const block = useEditor((state) => state.document.blocks[parentId]);
  if (!block) return null;

  if (block.children.length === 0) {
    return <DropGap parentId={parentId} index={0} empty />;
  }

  return (
    <>
      {block.children.map((childId, index) => (
        <Fragment key={childId}>
          <DropGap parentId={parentId} index={index} />
          <BlockNode id={childId} />
        </Fragment>
      ))}
      <DropGap parentId={parentId} index={block.children.length} />
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
    data: { kind: "gap", parentId, index },
  });

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "rounded transition-all",
        empty
          ? "flex min-h-16 items-center justify-center border border-dashed border-slate-300 text-xs text-slate-400"
          : "h-2",
        isOver && (empty ? "border-blue-500 bg-blue-50 text-blue-600" : "h-6 bg-blue-100"),
      )}
    >
      {empty ? "Tarik blok ke sini" : null}
    </div>
  );
}
