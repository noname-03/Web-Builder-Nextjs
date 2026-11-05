import { isContainerType, type Block, type BlockType, type BuilderDocument } from "@/features/editor/schemas/document";

export function isAllowedChild(parentType: BlockType, childType: BlockType): boolean {
  if (!isContainerType(parentType)) return false;
  if (childType === "column") return parentType === "columns";
  if (parentType === "columns") return childType === "column";
  if (parentType === "column") return childType !== "columns";
  return true;
}

export function findParentId(doc: BuilderDocument, childId: string): string | null {
  for (const block of Object.values(doc.blocks)) {
    if (block.children.includes(childId)) return block.id;
  }
  return null;
}

export function collectSubtree(doc: BuilderDocument, blockId: string): Set<string> {
  const ids = new Set<string>();
  const visit = (id: string) => {
    if (ids.has(id)) return;
    ids.add(id);
    const block = doc.blocks[id];
    if (!block) return;
    block.children.forEach(visit);
  };
  visit(blockId);
  return ids;
}

export function isDescendant(doc: BuilderDocument, ancestorId: string, nodeId: string): boolean {
  return collectSubtree(doc, ancestorId).has(nodeId) && ancestorId !== nodeId;
}

function clampIndex(index: number, length: number): number {
  if (!Number.isFinite(index)) return length;
  return Math.max(0, Math.min(Math.trunc(index), length));
}

export function insertBlock(
  doc: BuilderDocument,
  input: { parentId: string; index: number; block: Block },
): BuilderDocument {
  const parent = doc.blocks[input.parentId];
  if (!parent || !isContainerType(parent.type)) return doc;
  if (!isAllowedChild(parent.type, input.block.type)) return doc;
  if (doc.blocks[input.block.id]) return doc;

  const children = [...parent.children];
  children.splice(clampIndex(input.index, children.length), 0, input.block.id);

  return {
    ...doc,
    blocks: {
      ...doc.blocks,
      [input.block.id]: input.block,
      [parent.id]: { ...parent, children },
    },
  };
}

export function removeBlock(doc: BuilderDocument, blockId: string): BuilderDocument {
  if (blockId === doc.rootId || !doc.blocks[blockId]) return doc;

  const parentId = findParentId(doc, blockId);
  if (!parentId) return doc;

  const removedIds = collectSubtree(doc, blockId);
  const blocks: Record<string, Block> = {};

  for (const [id, block] of Object.entries(doc.blocks)) {
    if (removedIds.has(id)) continue;
    blocks[id] = block;
  }

  const parent = blocks[parentId];
  if (parent) {
    blocks[parentId] = { ...parent, children: parent.children.filter((id) => id !== blockId) };
  }

  return { ...doc, blocks };
}

export function moveBlock(
  doc: BuilderDocument,
  input: { blockId: string; parentId: string; index: number },
): BuilderDocument {
  const { blockId, parentId } = input;
  if (blockId === doc.rootId) return doc;

  const block = doc.blocks[blockId];
  const target = doc.blocks[parentId];
  if (!block || !target || !isContainerType(target.type)) return doc;
  if (!isAllowedChild(target.type, block.type)) return doc;
  if (blockId === parentId || isDescendant(doc, blockId, parentId)) return doc;

  const oldParentId = findParentId(doc, blockId);
  if (!oldParentId) return doc;

  const oldParent = doc.blocks[oldParentId];
  if (!oldParent) return doc;

  const oldIndex = oldParent.children.indexOf(blockId);
  let insertIndex = clampIndex(input.index, target.children.length);

  if (oldParentId === parentId) {
    if (oldIndex < insertIndex) insertIndex -= 1;
    if (oldIndex === insertIndex) return doc;
  }

  const oldChildren = oldParent.children.filter((id) => id !== blockId);
  const targetChildren =
    oldParentId === parentId ? oldChildren : [...target.children];

  targetChildren.splice(clampIndex(insertIndex, targetChildren.length), 0, blockId);

  const blocks = { ...doc.blocks };

  if (oldParentId === parentId) {
    const parent = blocks[parentId];
    if (!parent) return doc;
    blocks[parentId] = { ...parent, children: targetChildren };
  } else {
    blocks[oldParentId] = { ...oldParent, children: oldChildren };
    blocks[parentId] = { ...target, children: targetChildren };
  }

  return { ...doc, blocks };
}

export function updateBlockProps(
  doc: BuilderDocument,
  blockId: string,
  props: Record<string, unknown>,
): BuilderDocument {
  const block = doc.blocks[blockId];
  if (!block) return doc;

  return {
    ...doc,
    blocks: {
      ...doc.blocks,
      [blockId]: { ...block, props: { ...block.props, ...props } },
    },
  };
}

export function updateBlockStyle(
  doc: BuilderDocument,
  blockId: string,
  style: Record<string, string>,
): BuilderDocument {
  const block = doc.blocks[blockId];
  if (!block) return doc;

  return {
    ...doc,
    blocks: {
      ...doc.blocks,
      [blockId]: { ...block, style: { ...block.style, ...style } },
    },
  };
}

export function removeBlockStyle(
  doc: BuilderDocument,
  blockId: string,
  styleKey: string,
): BuilderDocument {
  const block = doc.blocks[blockId];
  if (!block) return doc;

  const nextStyle = { ...block.style };
  delete nextStyle[styleKey as keyof typeof nextStyle];

  return {
    ...doc,
    blocks: {
      ...doc.blocks,
      [blockId]: { ...block, style: nextStyle },
    },
  };
}

export function cloneBlock(
  doc: BuilderDocument,
  blockId: string,
  createId: () => string,
): BuilderDocument {
  if (blockId === doc.rootId) return doc;

  const parentId = findParentId(doc, blockId);
  if (!parentId) return doc;

  const parent = doc.blocks[parentId];
  if (!parent) return doc;

  const blocks = { ...doc.blocks };

  const cloneSubtree = (sourceId: string): string => {
    const source = blocks[sourceId];
    const newId = createId();
    if (!source) return newId;

    const children = source.children.map(cloneSubtree);
    blocks[newId] = { ...source, id: newId, children };
    return newId;
  };

  const newRootId = cloneSubtree(blockId);
  const index = parent.children.indexOf(blockId);
  const children = [...parent.children];
  children.splice(index + 1, 0, newRootId);
  blocks[parentId] = { ...parent, children };

  return { ...doc, blocks };
}

export function updateDocumentMeta(
  doc: BuilderDocument,
  meta: Partial<BuilderDocument["meta"]>,
): BuilderDocument {
  return { ...doc, meta: { ...doc.meta, ...meta } };
}
