"use client";

import { useDraggable } from "@dnd-kit/core";
import { clsx } from "clsx";
import { BLOCK_DEFINITIONS, PALETTE_GROUPS } from "@/features/editor/blocks/registry";
import type { BlockType } from "@/features/editor/schemas/document";
import { useEditor } from "@/features/editor/store/editor-context";

function blockCount(documentBlocks: Record<string, unknown>): number {
  return Object.keys(documentBlocks).length;
}

export function Palette() {
  const blockTotal = useEditor((state) => blockCount(state.document.blocks));
  const disabled = blockTotal >= 500;

  return (
    <aside className="hidden w-60 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-3 lg:block">
      <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Blok</h2>
      {disabled ? (
        <p className="mt-2 rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">
          Batas 500 blok tercapai.
        </p>
      ) : null}

      <div className="mt-3 space-y-4">
        {PALETTE_GROUPS.map((group) => (
          <div key={group.category}>
            <p className="px-1 text-xs font-medium text-slate-500">{group.category}</p>
            <div className="mt-1 space-y-1">
              {group.types.map((type) => (
                <PaletteItem key={type} type={type} disabled={disabled} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

function PaletteItem({ type, disabled }: { type: BlockType; disabled: boolean }) {
  const definition = BLOCK_DEFINITIONS[type];
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${type}`,
    data: { source: "palette", blockType: type },
    disabled,
  });

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      type="button"
      disabled={disabled}
      title={definition.description}
      className={clsx(
        "flex w-full cursor-grab flex-col items-start rounded-md border border-slate-200 px-2 py-1.5 text-left text-sm hover:border-blue-400 hover:bg-blue-50",
        isDragging && "opacity-50",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span className="font-medium text-slate-800">{definition.label}</span>
      <span className="text-xs text-slate-500">{definition.description}</span>
    </button>
  );
}
