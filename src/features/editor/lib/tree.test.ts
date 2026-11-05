import { describe, expect, it } from "vitest";
import { createBlock } from "@/features/editor/blocks/registry";
import { createEmptyDocument, type BuilderDocument } from "@/features/editor/schemas/document";
import {
  cloneBlock,
  findParentId,
  insertBlock,
  moveBlock,
  removeBlock,
  updateBlockProps,
} from "@/features/editor/lib/tree";

function withText(id: string, text: string): ReturnType<typeof createBlock> {
  return { ...createBlock("text", id), props: { text } };
}

function baseDoc(): BuilderDocument {
  const doc = createEmptyDocument("Test");
  const section = createBlock("section", "section1");
  doc.blocks.section1 = section;
  doc.blocks.root!.children = ["section1"];
  return doc;
}

describe("tree operations", () => {
  it("inserts a block into a container", () => {
    const doc = baseDoc();
    const next = insertBlock(doc, { parentId: "section1", index: 0, block: withText("t1", "Halo") });

    expect(next.blocks.section1?.children).toEqual(["t1"]);
    expect(next.blocks.t1?.props.text).toBe("Halo");
    expect(doc.blocks.t1).toBeUndefined();
  });

  it("rejects insertion into a non-container", () => {
    const doc = baseDoc();
    const withChild = insertBlock(doc, { parentId: "section1", index: 0, block: withText("t1", "Halo") });
    const next = insertBlock(withChild, { parentId: "t1", index: 0, block: withText("t2", "X") });

    expect(next).toBe(withChild);
  });

  it("rejects a column outside columns", () => {
    const doc = baseDoc();
    const next = insertBlock(doc, {
      parentId: "section1",
      index: 0,
      block: createBlock("column", "col1"),
    });

    expect(next).toBe(doc);
  });

  it("rejects moving a block into its own descendant", () => {
    const doc = baseDoc();
    const withSection = insertBlock(doc, {
      parentId: "section1",
      index: 0,
      block: createBlock("container", "c1"),
    });
    const next = moveBlock(withSection, { blockId: "section1", parentId: "c1", index: 0 });

    expect(next).toBe(withSection);
  });

  it("moves a block between containers", () => {
    const doc = baseDoc();
    const withTwo = insertBlock(
      insertBlock(doc, { parentId: "section1", index: 0, block: withText("a", "A") }),
      { parentId: "root", index: 1, block: createBlock("section", "section2") },
    );

    const moved = moveBlock(withTwo, { blockId: "a", parentId: "section2", index: 0 });

    expect(moved.blocks.section1?.children).toEqual([]);
    expect(moved.blocks.section2?.children).toEqual(["a"]);
    expect(findParentId(moved, "a")).toBe("section2");
  });

  it("removes a block and its descendants", () => {
    const doc = baseDoc();
    const withChild = insertBlock(doc, { parentId: "section1", index: 0, block: withText("a", "A") });
    const removed = removeBlock(withChild, "section1");

    expect(removed.blocks.a).toBeUndefined();
    expect(removed.blocks.section1).toBeUndefined();
    expect(removed.blocks.root?.children).toEqual([]);
  });

  it("does not remove the root block", () => {
    const doc = baseDoc();
    expect(removeBlock(doc, "root")).toBe(doc);
  });

  it("clones a block with new ids", () => {
    const doc = baseDoc();
    const withChild = insertBlock(doc, { parentId: "section1", index: 0, block: withText("a", "A") });
    let counter = 0;
    const cloned = cloneBlock(withChild, "a", () => `new-${counter++}`);

    expect(cloned.blocks.section1?.children).toEqual(["a", "new-0"]);
    expect(cloned.blocks["new-0"]?.props.text).toBe("A");
    expect(cloned.blocks["new-0"]?.id).toBe("new-0");
  });

  it("updates props immutably", () => {
    const doc = baseDoc();
    const withChild = insertBlock(doc, { parentId: "section1", index: 0, block: withText("a", "A") });
    const updated = updateBlockProps(withChild, "a", { text: "B" });

    expect(updated.blocks.a?.props.text).toBe("B");
    expect(withChild.blocks.a?.props.text).toBe("A");
  });
});
