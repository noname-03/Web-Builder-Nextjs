import { describe, expect, it } from "vitest";
import {
  createEmptyDocument,
  type Block,
  type BlockType,
  type BuilderDocument,
} from "@/features/editor/schemas/document";
import {
  LIBRARY_ISSUE_NAME,
  checkTemplateLibrary,
  checkTemplateQuality,
} from "@/features/templates/template-quality";
import { SEED_TEMPLATES } from "../../../prisma/seed-templates";

function addBlock(
  doc: BuilderDocument,
  parentId: string,
  block: { id: string; type: BlockType; props?: Record<string, unknown> },
): string {
  const created: Block = {
    id: block.id,
    type: block.type,
    props: block.props ?? {},
    style: {},
    children: [],
  };
  doc.blocks[created.id] = created;
  doc.blocks[parentId]?.children.push(created.id);
  return created.id;
}

function buildHealthyDocument(text = "Halaman contoh yang siap dipakai."): BuilderDocument {
  const doc = createEmptyDocument("Contoh Bersih");
  const rootId = doc.rootId;
  addBlock(doc, rootId, { id: "nav", type: "navbar", props: { brand: "Contoh", items: [] } });
  addBlock(doc, rootId, { id: "hero", type: "heading", props: { text: "Judul Halaman", level: 1 } });
  addBlock(doc, rootId, { id: "copy", type: "text", props: { text } });
  addBlock(doc, rootId, { id: "cta", type: "button", props: { text: "Hubungi Kami", href: "#" } });
  return doc;
}

describe("checkTemplateQuality", () => {
  it("accepts a healthy document", () => {
    expect(checkTemplateQuality("Contoh Bersih", buildHealthyDocument())).toEqual([]);
  });

  it("rejects a document with lorem ipsum placeholder text", () => {
    const doc = buildHealthyDocument("Lorem ipsum dolor sit amet, consectetur adipiscing elit.");
    const issues = checkTemplateQuality("Contoh Placeholder", doc);

    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((message) => /lorem ipsum/i.test(message))).toBe(true);
  });

  it("rejects other Indonesian placeholder fragments", () => {
    const doc = buildHealthyDocument("Tulis teks Anda di sini agar terlihat penuh.");
    const issues = checkTemplateQuality("Contoh Placeholder", doc);

    expect(issues.some((message) => /tulis teks anda/i.test(message))).toBe(true);
  });

  it("requires heading, text and action blocks for non-blank templates", () => {
    const doc = createEmptyDocument("Hanya Judul");
    addBlock(doc, doc.rootId, { id: "hero", type: "heading", props: { text: "Judul", level: 1 } });

    const issues = checkTemplateQuality("Contoh Tanpa Aksi", doc);
    expect(issues.some((message) => /blok teks/i.test(message))).toBe(true);
    expect(issues.some((message) => /tombol atau tautan/i.test(message))).toBe(true);
  });

  it("does not require content blocks for the blank template", () => {
    const blank = SEED_TEMPLATES.find((template) => template.name === "Halaman Kosong");
    expect(blank).toBeDefined();
    expect(checkTemplateQuality("Halaman Kosong", blank!.content)).toEqual([]);
  });

  it("rejects a background image without backgroundSize", () => {
    const doc = buildHealthyDocument();
    addBlock(doc, doc.rootId, {
      id: "bg",
      type: "section",
      props: { backgroundImage: "https://example.com/foto.jpg" },
    });

    const issues = checkTemplateQuality("Contoh Background", doc);
    expect(issues.some((message) => /backgroundSize/i.test(message))).toBe(true);
  });

  it("reports invalid documents instead of throwing", () => {
    const broken = { version: 1, rootId: "root", blocks: {}, fonts: [] } as unknown as BuilderDocument;
    const issues = checkTemplateQuality("Dokumen Rusak", broken);

    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((message) => /validasi skema/i.test(message))).toBe(true);
  });
});

describe("checkTemplateLibrary", () => {
  it("passes the curated seed library", () => {
    expect(checkTemplateLibrary(SEED_TEMPLATES)).toEqual([]);
  });

  it("flags a library without gradients, backgrounds, image logos or fonts", () => {
    const library = [{ name: "Contoh Bersih", content: buildHealthyDocument() }];
    const issues = checkTemplateLibrary(library);

    expect(issues.length).toBeGreaterThan(0);
    expect(issues.every((issue) => issue.name === LIBRARY_ISSUE_NAME)).toBe(true);
    const messages = issues.map((issue) => issue.message).join("\n");
    expect(messages).toMatch(/gradient/i);
    expect(messages).toMatch(/backgroundImage/);
    expect(messages).toMatch(/brandType image/);
    expect(messages).toMatch(/font/i);
  });

  it("prefixes per-template issues with the template name", () => {
    const library = [
      ...SEED_TEMPLATES,
      { name: "Template Rusak", content: buildHealthyDocument("Lorem ipsum dolor sit amet.") },
    ];
    const issues = checkTemplateLibrary(library);

    expect(issues.some((issue) => issue.name === "Template Rusak")).toBe(true);
    expect(checkTemplateLibrary(SEED_TEMPLATES)).toEqual([]);
  });
});
