import type { Block, BlockType } from "@/features/editor/schemas/document";

export type PropField =
  | { key: string; label: string; kind: "text" | "url" | "number"; placeholder?: string }
  | { key: string; label: string; kind: "select"; options: Array<{ value: string; label: string }> };

export type BlockDefinition = {
  type: BlockType;
  label: string;
  description: string;
  category: "Layout" | "Konten" | "Komponen";
  isContainer: boolean;
  defaultProps: Record<string, unknown>;
  defaultStyle: Record<string, string>;
  fields: PropField[];
  supportsNavbarItems?: boolean;
};

export const BLOCK_DEFINITIONS: Record<BlockType, BlockDefinition> = {
  section: {
    type: "section",
    label: "Section",
    description: "Pembungkus bagian halaman",
    category: "Layout",
    isContainer: true,
    defaultProps: {},
    defaultStyle: { padding: "24px 0" },
    fields: [],
  },
  container: {
    type: "container",
    label: "Container",
    description: "Membatasi lebar konten",
    category: "Layout",
    isContainer: true,
    defaultProps: { maxWidth: "1200px" },
    defaultStyle: { margin: "0 auto" },
    fields: [{ key: "maxWidth", label: "Max width", kind: "text", placeholder: "1200px" }],
  },
  columns: {
    type: "columns",
    label: "Columns",
    description: "Baris berisi beberapa kolom",
    category: "Layout",
    isContainer: true,
    defaultProps: { columns: 2, gap: "16px" },
    defaultStyle: { display: "flex", gap: "16px", margin: "16px 0" },
    fields: [{ key: "gap", label: "Gap", kind: "text", placeholder: "16px" }],
  },
  column: {
    type: "column",
    label: "Column",
    description: "Kolom di dalam Columns",
    category: "Layout",
    isContainer: true,
    defaultProps: {},
    defaultStyle: { padding: "8px" },
    fields: [],
  },
  heading: {
    type: "heading",
    label: "Heading",
    description: "Judul atau subjudul",
    category: "Konten",
    isContainer: false,
    defaultProps: { text: "Judul baru", level: 2 },
    defaultStyle: { margin: "0 0 12px" },
    fields: [
      { key: "text", label: "Teks", kind: "text" },
      {
        key: "level",
        label: "Level",
        kind: "select",
        options: [
          { value: "1", label: "H1" },
          { value: "2", label: "H2" },
          { value: "3", label: "H3" },
          { value: "4", label: "H4" },
          { value: "5", label: "H5" },
          { value: "6", label: "H6" },
        ],
      },
    ],
  },
  text: {
    type: "text",
    label: "Teks",
    description: "Paragraf teks",
    category: "Konten",
    isContainer: false,
    defaultProps: { text: "Tulis teks Anda di sini." },
    defaultStyle: { margin: "0 0 12px" },
    fields: [{ key: "text", label: "Teks", kind: "text" }],
  },
  image: {
    type: "image",
    label: "Gambar",
    description: "Gambar dari URL",
    category: "Konten",
    isContainer: false,
    defaultProps: { src: "", alt: "" },
    defaultStyle: { maxWidth: "100%", borderRadius: "8px" },
    fields: [
      { key: "src", label: "URL gambar", kind: "url", placeholder: "https://..." },
      { key: "alt", label: "Alt", kind: "text" },
    ],
  },
  button: {
    type: "button",
    label: "Tombol",
    description: "Tombol tautan",
    category: "Konten",
    isContainer: false,
    defaultProps: { text: "Klik di sini", href: "#" },
    defaultStyle: {},
    fields: [
      { key: "text", label: "Teks", kind: "text" },
      { key: "href", label: "URL tujuan", kind: "url", placeholder: "https://..." },
    ],
  },
  link: {
    type: "link",
    label: "Link",
    description: "Tautan teks",
    category: "Konten",
    isContainer: false,
    defaultProps: { text: "Tautan", href: "#" },
    defaultStyle: {},
    fields: [
      { key: "text", label: "Teks", kind: "text" },
      { key: "href", label: "URL tujuan", kind: "url", placeholder: "https://..." },
    ],
  },
  divider: {
    type: "divider",
    label: "Pembatas",
    description: "Garis horizontal",
    category: "Konten",
    isContainer: false,
    defaultProps: {},
    defaultStyle: { margin: "16px 0", border: "1px solid #e5e7eb" },
    fields: [],
  },
  spacer: {
    type: "spacer",
    label: "Spacer",
    description: "Ruang kosong",
    category: "Konten",
    isContainer: false,
    defaultProps: { height: "32px" },
    defaultStyle: { height: "32px" },
    fields: [{ key: "height", label: "Tinggi", kind: "text", placeholder: "32px" }],
  },
  navbar: {
    type: "navbar",
    label: "Navbar",
    description: "Menu navigasi atas",
    category: "Komponen",
    isContainer: false,
    defaultProps: {
      brand: "Brand",
      items: [
        { label: "Beranda", href: "#" },
        { label: "Kontak", href: "#" },
      ],
    },
    defaultStyle: { padding: "12px 0", borderBottom: "1px solid #e5e7eb" },
    fields: [{ key: "brand", label: "Nama brand", kind: "text" }],
    supportsNavbarItems: true,
  },
  hero: {
    type: "hero",
    label: "Hero",
    description: "Bagian pembuka dengan CTA",
    category: "Komponen",
    isContainer: false,
    defaultProps: {
      title: "Judul utama",
      subtitle: "Deskripsi singkat halaman Anda.",
      buttonText: "Mulai",
      buttonHref: "#",
    },
    defaultStyle: { padding: "40px 0" },
    fields: [
      { key: "title", label: "Judul", kind: "text" },
      { key: "subtitle", label: "Subjudul", kind: "text" },
      { key: "buttonText", label: "Teks tombol", kind: "text" },
      { key: "buttonHref", label: "URL tombol", kind: "url" },
    ],
  },
  footer: {
    type: "footer",
    label: "Footer",
    description: "Kaki halaman",
    category: "Komponen",
    isContainer: false,
    defaultProps: { text: "© 2026 Brand Anda." },
    defaultStyle: { padding: "24px 0", borderTop: "1px solid #e5e7eb" },
    fields: [{ key: "text", label: "Teks", kind: "text" }],
  },
};

export const PALETTE_GROUPS: Array<{
  category: BlockDefinition["category"];
  types: BlockType[];
}> = [
  { category: "Layout", types: ["section", "container", "columns"] },
  { category: "Konten", types: ["heading", "text", "image", "button", "link", "divider", "spacer"] },
  { category: "Komponen", types: ["navbar", "hero", "footer"] },
];

export function createBlock(type: BlockType, id: string): Block {
  const definition = BLOCK_DEFINITIONS[type];
  return {
    id,
    type,
    props: structuredClone(definition.defaultProps),
    style: { ...definition.defaultStyle },
    children: [],
  };
}
