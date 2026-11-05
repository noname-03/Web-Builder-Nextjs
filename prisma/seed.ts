import { randomUUID } from "node:crypto";
import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  createEmptyDocument,
  parseDocument,
  type Block,
  type BuilderDocument,
} from "../src/features/editor/schemas/document";

const prisma = new PrismaClient();

function newId(): string {
  return randomUUID().replace(/-/g, "").slice(0, 10);
}

type BlockInput = {
  type: Block["type"];
  props?: Record<string, unknown>;
  style?: Record<string, string>;
  children?: string[];
};

function addBlock(doc: BuilderDocument, parentId: string, input: BlockInput): string {
  const id = newId();
  doc.blocks[id] = {
    id,
    type: input.type,
    props: input.props ?? {},
    style: (input.style ?? {}) as Block["style"],
    children: input.children ?? [],
  };
  doc.blocks[parentId]?.children.push(id);
  return id;
}

function buildLandingTemplate(): BuilderDocument {
  const doc = createEmptyDocument("Landing Page Sederhana");
  const root = doc.rootId;

  addBlock(doc, root, {
    type: "navbar",
    props: {
      brand: "Brand Anda",
      items: [
        { label: "Beranda", href: "#" },
        { label: "Fitur", href: "#" },
        { label: "Kontak", href: "#" },
      ],
    },
  });

  addBlock(doc, root, {
    type: "hero",
    props: {
      title: "Bangun halaman web tanpa coding",
      subtitle: "Susun konten dengan drag & drop, lalu unduh sebagai HTML.",
      buttonText: "Mulai Sekarang",
      buttonHref: "#",
    },
    style: { textAlign: "center" },
  });

  const columns = addBlock(doc, root, {
    type: "columns",
    props: { columns: 3, gap: "16px" },
    style: { margin: "24px 0" },
  });

  for (const title of ["Mudah Dipakai", "Cepat", "Fleksibel"]) {
    const columnId = newId();
    doc.blocks[columnId] = {
      id: columnId,
      type: "column",
      props: {},
      style: { padding: "16px", border: "1px solid #e5e7eb", borderRadius: "8px" },
      children: [],
    };
    doc.blocks[columns]?.children.push(columnId);

    addBlock(doc, columnId, {
      type: "heading",
      props: { text: title, level: 3 },
    });
    addBlock(doc, columnId, {
      type: "text",
      props: { text: "Jelaskan keunggulan fitur ini dalam satu atau dua kalimat singkat." },
    });
  }

  addBlock(doc, root, {
    type: "footer",
    props: { text: "© 2026 Brand Anda. Semua hak dilindungi." },
  });

  return doc;
}

function buildPortfolioTemplate(): BuilderDocument {
  const doc = createEmptyDocument("Portofolio");
  const root = doc.rootId;

  addBlock(doc, root, {
    type: "heading",
    props: { text: "Nama Anda", level: 1 },
  });
  addBlock(doc, root, {
    type: "text",
    props: { text: "Desainer produk dan pengembang web yang berfokus pada pengalaman pengguna." },
  });
  addBlock(doc, root, {
    type: "divider",
    props: {},
    style: { margin: "24px 0" },
  });
  addBlock(doc, root, {
    type: "heading",
    props: { text: "Proyek Terbaru", level: 2 },
  });
  addBlock(doc, root, {
    type: "text",
    props: { text: "Tuliskan deskripsi singkat proyek unggulan Anda di sini." },
  });
  addBlock(doc, root, {
    type: "button",
    props: { text: "Hubungi Saya", href: "mailto:hello@example.com" },
  });

  return doc;
}

function buildEmptyTemplate(): BuilderDocument {
  return createEmptyDocument("Halaman Kosong");
}

type TemplateSeed = { name: string; description: string; content: BuilderDocument };

const TEMPLATES: TemplateSeed[] = [
  {
    name: "Landing Page Sederhana",
    description: "Halaman promosi dengan hero, tiga kolom fitur, dan footer.",
    content: parseDocument(buildLandingTemplate()),
  },
  {
    name: "Portofolio",
    description: "Halaman perkenalan singkat dengan tombol kontak.",
    content: parseDocument(buildPortfolioTemplate()),
  },
  {
    name: "Halaman Kosong",
    description: "Mulai dari nol dengan satu container kosong.",
    content: parseDocument(buildEmptyTemplate()),
  },
];

async function seedAdmin(): Promise<void> {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@example.com").trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", isActive: true },
    create: { email, name: "Administrator", passwordHash, role: "ADMIN" },
  });

  console.log(`Admin siap: ${email}`);
}

async function seedTemplates(): Promise<void> {
  for (const template of TEMPLATES) {
    const existing = await prisma.template.findFirst({ where: { name: template.name } });
    const content = template.content as unknown as Prisma.InputJsonValue;

    if (existing) {
      await prisma.template.update({
        where: { id: existing.id },
        data: { description: template.description, content },
      });
      continue;
    }

    await prisma.template.create({
      data: { name: template.name, description: template.description, content },
    });
  }

  console.log(`${TEMPLATES.length} template siap.`);
}

async function main(): Promise<void> {
  await seedAdmin();
  await seedTemplates();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
