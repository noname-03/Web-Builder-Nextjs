import { describe, expect, it } from "vitest";
import {
  createEmptyDocument,
  parseDocument,
  validateDocumentStructure,
  type BuilderDocument,
} from "@/features/editor/schemas/document";

function textBlock(id: string, text: string) {
  return { id, type: "text" as const, props: { text }, style: {}, children: [] };
}

function docWithText(text: string): BuilderDocument {
  const doc = createEmptyDocument("Test");
  doc.blocks.t1 = textBlock("t1", text);
  doc.blocks.root!.children = ["t1"];
  return doc;
}

describe("builder document schema", () => {
  it("accepts an empty document", () => {
    expect(() => parseDocument(createEmptyDocument())).not.toThrow();
  });

  it("rejects an unsafe hyperlink", () => {
    const doc = docWithText("aman");
    doc.blocks.btn = {
      id: "btn",
      type: "button",
      props: { text: "Klik", href: "javascript:alert(1)" },
      style: {},
      children: [],
    };
    doc.blocks.root!.children.push("btn");

    expect(() => parseDocument(doc)).toThrow();
  });

  it("rejects dangerous style values", () => {
    const doc = docWithText("aman");
    doc.blocks.t1!.style = { backgroundColor: "url(javascript:alert(1))" };

    expect(() => parseDocument(doc)).toThrow();
  });

  it("rejects unknown style keys", () => {
    const doc = docWithText("aman");
    doc.blocks.t1!.style = { position: "fixed" } as never;

    expect(() => parseDocument(doc)).toThrow();
  });

  it("rejects orphan blocks", () => {
    const doc = docWithText("aman");
    doc.blocks.orphan = textBlock("orphan", "Tidak terhubung");

    const errors = validateDocumentStructure(doc);
    expect(errors.some((error) => error.includes("tidak terhubung"))).toBe(true);
  });

  it("rejects a column outside columns", () => {
    const doc = createEmptyDocument("Test");
    doc.blocks.col = { id: "col", type: "column", props: {}, style: {}, children: [] };
    doc.blocks.root!.children = ["col"];

    const errors = validateDocumentStructure(doc);
    expect(errors.some((error) => error.includes("column"))).toBe(true);
  });

  it("rejects more than 500 blocks", () => {
    const doc = createEmptyDocument("Test");
    for (let index = 0; index < 501; index++) {
      const id = `b${index}`;
      doc.blocks[id] = textBlock(id, "x");
      doc.blocks.root!.children.push(id);
    }

    expect(() => parseDocument(doc)).toThrow();
  });

  it("rejects documents deeper than 12 levels", () => {
    const doc = createEmptyDocument("Test");
    let parentId = doc.rootId;
    for (let depth = 0; depth < 14; depth++) {
      const id = `d${depth}`;
      doc.blocks[id] = { id, type: "container", props: {}, style: {}, children: [] };
      doc.blocks[parentId]?.children.push(id);
      parentId = id;
    }

    const errors = validateDocumentStructure(doc);
    expect(errors.some((error) => error.includes("Kedalaman"))).toBe(true);
  });
});
