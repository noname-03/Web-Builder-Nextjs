import {
  createEmptyDocument,
  type BlockStyle,
  type BlockType,
  type BuilderDocument,
  type FontDefinition,
} from "../src/features/editor/schemas/document";

function newId(): string {
  return Math.random().toString(36).slice(2, 12);
}

type BlockInput = {
  type: BlockType;
  props?: Record<string, unknown>;
  style?: BlockStyle;
};

function add(doc: BuilderDocument, parentId: string, input: BlockInput): string {
  const id = newId();
  doc.blocks[id] = {
    id,
    type: input.type,
    props: input.props ?? {},
    style: input.style ?? {},
    children: [],
  };
  doc.blocks[parentId]?.children.push(id);
  return id;
}

function addHeading(
  doc: BuilderDocument,
  parentId: string,
  text: string,
  level: number,
  style: BlockStyle = {},
): string {
  return add(doc, parentId, { type: "heading", props: { text, level }, style });
}

function addText(
  doc: BuilderDocument,
  parentId: string,
  text: string,
  style: BlockStyle = {},
): string {
  return add(doc, parentId, { type: "text", props: { text }, style: { margin: "0 0 12px", color: "#475569", ...style } });
}

function addSection(
  doc: BuilderDocument,
  parentId: string,
  input: { props?: Record<string, unknown>; style?: BlockStyle },
): string {
  return add(doc, parentId, { type: "section", props: input.props ?? {}, style: { padding: "48px 24px", ...input.style } });
}

function addColumns(
  doc: BuilderDocument,
  parentId: string,
  count: number,
  gap = "24px",
): string {
  return add(doc, parentId, {
    type: "columns",
    props: { columns: count, gap },
    style: { display: "flex", gap, margin: "0 0 24px" },
  });
}

function addColumn(doc: BuilderDocument, columnsId: string, style: BlockStyle = {}): string {
  return add(doc, columnsId, { type: "column", style: { padding: "16px", ...style } });
}

function addButton(
  doc: BuilderDocument,
  parentId: string,
  text: string,
  options: { href?: string; style?: BlockStyle } = {},
): string {
  return add(doc, parentId, {
    type: "button",
    props: { text, href: options.href ?? "#" },
    style: options.style ?? {},
  });
}

function addFooter(doc: BuilderDocument, text: string, style: BlockStyle = {}): void {
  add(doc, doc.rootId, { type: "footer", props: { text }, style: { padding: "24px", ...style } });
}

const INTER_FONT: FontDefinition = {
  id: "inter",
  family: "Inter",
  url: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2",
  weight: "400",
};

function withInter(doc: BuilderDocument): BuilderDocument {
  doc.fonts = [INTER_FONT];
  doc.meta.fontFamily = "Inter";
  return doc;
}

function addNavbar(
  doc: BuilderDocument,
  options: {
    brand: string;
    items?: Array<{ label: string; href: string }>;
    logo?: string;
    style?: BlockStyle;
  },
): void {
  const props: Record<string, unknown> = {
    brand: options.brand,
    items: options.items ?? [
      { label: "Beranda", href: "#" },
      { label: "Fitur", href: "#" },
      { label: "Kontak", href: "#" },
    ],
  };

  if (options.logo) {
    props.brandType = "image";
    props.brandImage = options.logo;
    props.brandImageAlt = options.brand;
    props.brandImageWidth = "140px";
  }

  add(doc, doc.rootId, {
    type: "navbar",
    props,
    style: { padding: "16px 24px", borderBottom: "1px solid #e2e8f0", ...options.style },
  });
}

function heroGradient(): BlockStyle {
  return {
    backgroundImage: "linear-gradient(135deg,#0f172a,#1d4ed8)",
    color: "#f8fafc",
    padding: "64px 24px",
    borderRadius: "12px",
  };
}

export function buildSaasLanding(): BuilderDocument {
  const doc = withInter(createEmptyDocument("SaaS Landing"));
  addNavbar(doc, {
    brand: "Northwind",
    logo: "https://dummyimage.com/160x40/0f172a/ffffff.png&text=Northwind",
    items: [
      { label: "Produk", href: "#" },
      { label: "Harga", href: "#" },
      { label: "Kontak", href: "#" },
    ],
  });

  const hero = addSection(doc, doc.rootId, { style: { ...heroGradient(), margin: "24px 0" } });
  addHeading(doc, hero, "Kelola tim HR dalam satu platform", 1, {
    fontSize: "44px",
    lineHeight: "1.1",
    margin: "0 0 16px",
    color: "#f8fafc",
  });
  addText(doc, hero, "Rekrut, onboarding, dan evaluasi karyawan tanpa spreadsheet. Semua data tim tersimpan rapi.", {
    color: "#c7d2fe",
    fontSize: "18px",
    maxWidth: "640px",
  });
  addButton(doc, hero, "Coba Gratis 14 Hari", {
    style: { backgroundColor: "#38bdf8", color: "#0f172a", borderRadius: "8px" },
  });

  const features = addSection(doc, doc.rootId, { style: { padding: "56px 24px" } });
  addHeading(doc, features, "Dibangun untuk tim yang tumbuh cepat", 2, {
    fontSize: "32px",
    textAlign: "center",
    margin: "0 0 32px",
  });

  const featureColumns = addColumns(doc, features, 3);
  const featureData = [
    { title: "Rekrutmen terukur", body: "Pipeline kandidat, skor wawancara, dan feedback dalam satu tampilan." },
    { title: "Onboarding otomatis", body: "Checklist per peran dan pengingat otomatis untuk manajer." },
    { title: "Analitik tim", body: "Lihat retensi, beban kerja, dan pertumbuhan tim setiap bulan." },
  ];

  for (const feature of featureData) {
    const column = addColumn(doc, featureColumns, {
      backgroundColor: "#f8fafc",
      borderRadius: "12px",
      padding: "24px",
      border: "1px solid #e2e8f0",
    });
    addHeading(doc, column, feature.title, 3, { fontSize: "20px", margin: "0 0 8px" });
    addText(doc, column, feature.body, { fontSize: "15px" });
  }

  const cta = addSection(doc, doc.rootId, {
    style: {
      backgroundColor: "#0f172a",
      borderRadius: "12px",
      padding: "40px 24px",
      textAlign: "center",
      margin: "0 0 24px",
    },
  });
  addHeading(doc, cta, "Siap merapikan operasional HR?", 2, { color: "#f8fafc", margin: "0 0 12px" });
  addText(doc, cta, "Mulai gratis, tanpa kartu kredit. Setup kurang dari 10 menit.", { color: "#cbd5e1" });
  addButton(doc, cta, "Mulai Sekarang");

  addFooter(doc, "© 2026 Northwind HR. Semua hak dilindungi.", { textAlign: "center", color: "#64748b" });
  return doc;
}

export function buildPortfolioMinimal(): BuilderDocument {
  const doc = withInter(createEmptyDocument("Portfolio Minimal"));
  addNavbar(doc, { brand: "Rani Prameswari", items: [
    { label: "Karya", href: "#" },
    { label: "Tentang", href: "#" },
    { label: "Kontak", href: "#" },
  ] });

  const hero = addSection(doc, doc.rootId, {
    props: {
      backgroundImage: "https://picsum.photos/seed/portrait/1600/900",
      backgroundSize: "cover",
      backgroundPosition: "center",
      overlayColor: "#0f172a",
      overlayOpacity: 45,
      minHeight: "520px",
    },
    style: { padding: "96px 24px", minHeight: "520px", borderRadius: "12px", margin: "24px 0" },
  });
  addHeading(doc, hero, "Rani Prameswari", 1, {
    fontSize: "46px",
    color: "#ffffff",
    margin: "0 0 12px",
  });
  addText(doc, hero, "Fotografer dan visual storyteller untuk brand yang peduli detail.", {
    color: "#e2e8f0",
    fontSize: "18px",
    maxWidth: "560px",
  });
  addButton(doc, hero, "Lihat Karya", { style: { backgroundColor: "#f8fafc", color: "#0f172a" } });

  const gallery = addSection(doc, doc.rootId, { style: { padding: "40px 24px" } });
  addHeading(doc, gallery, "Karya terpilih", 2, { fontSize: "28px", margin: "0 0 20px" });
  const columns = addColumns(doc, gallery, 3, "16px");
  for (const seed of ["portrait-1", "portrait-2", "portrait-3"]) {
    const column = addColumn(doc, columns, { padding: "0" });
    add(doc, column, {
      type: "image",
      props: { src: `https://picsum.photos/seed/${seed}/800/1000`, alt: "Karya fotografi" },
      style: { borderRadius: "12px", width: "100%" },
    });
  }

  addFooter(doc, "Tersedia untuk proyek di Jakarta dan sekitarnya · hello@rani.studio", {
    textAlign: "center",
    color: "#64748b",
  });
  return doc;
}

export function buildAgency(): BuilderDocument {
  const doc = withInter(createEmptyDocument("Agency Kreatif"));
  addNavbar(doc, {
    brand: "Studio Arah",
    logo: "https://dummyimage.com/160x40/111827/ffffff.png&text=Arah",
    items: [
      { label: "Layanan", href: "#" },
      { label: "Proyek", href: "#" },
      { label: "Kontak", href: "#" },
    ],
  });

  const hero = addSection(doc, doc.rootId, {
    props: {
      backgroundImage: "https://picsum.photos/seed/studio/1600/900",
      backgroundSize: "cover",
      backgroundPosition: "center",
      overlayColor: "#020617",
      overlayOpacity: 55,
      minHeight: "460px",
    },
    style: { padding: "80px 24px", borderRadius: "12px", margin: "24px 0" },
  });
  addHeading(doc, hero, "Brand yang berani butuh karya yang berani", 1, {
    fontSize: "42px",
    color: "#ffffff",
    maxWidth: "720px",
    margin: "0 0 16px",
  });
  addText(doc, hero, "Kami merancang identitas, kampanye, dan pengalaman digital untuk bisnis yang ingin menonjol.", {
    color: "#e2e8f0",
    fontSize: "18px",
    maxWidth: "620px",
  });
  addButton(doc, hero, "Mulai Proyek", { style: { backgroundColor: "#f97316", color: "#0f172a" } });

  const services = addSection(doc, doc.rootId, { style: { padding: "48px 24px" } });
  addHeading(doc, services, "Layanan inti", 2, { fontSize: "30px", margin: "0 0 24px" });
  const columns = addColumns(doc, services, 2);
  const servicesData = [
    { title: "Identitas Visual", body: "Logo, sistem warna, tipografi, dan panduan merek yang konsisten." },
    { title: "Kampanye Digital", body: "Konsep kreatif, aset sosial, dan landing page yang siap dipakai." },
    { title: "Desain Produk", body: "Riset pengguna, wireframe, dan UI yang fokus pada konversi." },
    { title: "Konten Foto & Video", body: "Produksi konten yang selaras dengan cerita merek Anda." },
  ];
  servicesData.forEach((service) => {
    const column = addColumn(doc, columns, {
      backgroundColor: "#f8fafc",
      borderRadius: "12px",
      padding: "24px",
      border: "1px solid #e2e8f0",
    });
    addHeading(doc, column, service.title, 3, { fontSize: "20px", margin: "0 0 8px" });
    addText(doc, column, service.body);
  });

  addFooter(doc, "Studio Arah · Jakarta · halo@studioarah.id", { textAlign: "center", color: "#64748b" });
  return doc;
}

export function buildStartupLaunch(): BuilderDocument {
  const doc = withInter(createEmptyDocument("Startup Launch"));
  addNavbar(doc, { brand: "Loopwise", items: [
    { label: "Produk", href: "#" },
    { label: "Kenapa kami", href: "#" },
    { label: "Kontak", href: "#" },
  ] });

  const hero = addSection(doc, doc.rootId, {
    style: {
      backgroundImage: "linear-gradient(135deg,#111827,#7c3aed)",
      color: "#f8fafc",
      borderRadius: "12px",
      padding: "64px 24px",
      margin: "24px 0",
    },
  });
  addHeading(doc, hero, "Ubah masukan pelanggan menjadi roadmap", 1, {
    fontSize: "44px",
    lineHeight: "1.1",
    color: "#f8fafc",
    margin: "0 0 16px",
  });
  addText(doc, hero, "Kumpulkan feedback, kelompokkan tema, dan prioritaskan fitur berikutnya dalam satu tempat.", {
    color: "#ddd6fe",
    fontSize: "18px",
    maxWidth: "640px",
  });
  addButton(doc, hero, "Gabung Waitlist", { style: { backgroundColor: "#c4b5fd", color: "#111827" } });

  const stats = addSection(doc, doc.rootId, { style: { padding: "32px 24px" } });
  const statColumns = addColumns(doc, stats, 4, "16px");
  const statsData = [
    { value: "12.000+", label: "feedback dianalisis" },
    { value: "3x", label: "lebih cepat memprioritaskan" },
    { value: "48 jam", label: "waktu setup" },
    { value: "4.8/5", label: "kepuasan tim produk" },
  ];
  for (const stat of statsData) {
    const column = addColumn(doc, statColumns, { textAlign: "center" });
    addHeading(doc, column, stat.value, 2, { fontSize: "30px", margin: "0 0 4px" });
    addText(doc, column, stat.label, { textAlign: "center" });
  }

  const features = addSection(doc, doc.rootId, { style: { padding: "40px 24px" } });
  addHeading(doc, features, "Alur kerja yang sederhana", 2, { fontSize: "30px", margin: "0 0 24px" });
  const featureColumns = addColumns(doc, features, 3);
  const featuresData = [
    { title: "Impor", body: "Hubungkan Slack, email, dan form tanpa menyalin manual." },
    { title: "Analisis", body: "AI mengelompokkan tema dan sentimen secara otomatis." },
    { title: "Prioritaskan", body: "Susun roadmap berdasarkan dampak dan usaha." },
  ];
  for (const feature of featuresData) {
    const column = addColumn(doc, featureColumns, {
      padding: "24px",
      borderRadius: "12px",
      backgroundColor: "#f8fafc",
      border: "1px solid #e2e8f0",
    });
    addHeading(doc, column, feature.title, 3, { fontSize: "20px", margin: "0 0 8px" });
    addText(doc, column, feature.body);
  }

  addFooter(doc, "© 2026 Loopwise. Dibuat untuk tim produk.", { textAlign: "center", color: "#64748b" });
  return doc;
}

export function buildPersonalBlog(): BuilderDocument {
  const doc = withInter(createEmptyDocument("Personal Blog"));
  addNavbar(doc, { brand: "Catatan Harian", items: [
    { label: "Artikel", href: "#" },
    { label: "Tentang", href: "#" },
  ] });

  const intro = addSection(doc, doc.rootId, { style: { padding: "48px 24px 24px" } });
  addHeading(doc, intro, "Catatan tentang produk, desain, dan cara berpikir", 1, {
    fontSize: "40px",
    lineHeight: "1.15",
    margin: "0 0 12px",
  });
  addText(doc, intro, "Tulisan pendek setiap minggu. Tanpa jargon, langsung ke inti.", {
    fontSize: "18px",
    color: "#475569",
  });

  const articles = addSection(doc, doc.rootId, { style: { padding: "16px 24px 48px" } });
  const columns = addColumns(doc, articles, 3, "16px");
  const articlesData = [
    { title: "Kenapa onboarding sering gagal", body: "Tiga pola yang membuat pengguna baru berhenti di langkah kedua.", seed: "blog-1" },
    { title: "Menulis pesan error yang berguna", body: "Pesan yang baik menjelaskan masalah, penyebab, dan langkah berikutnya.", seed: "blog-2" },
    { title: "Riset murah untuk tim kecil", body: "Wawancara 5 pengguna lebih berguna daripada survei 500 responden.", seed: "blog-3" },
  ];
  for (const article of articlesData) {
    const column = addColumn(doc, columns, { padding: "0" });
    add(doc, column, {
      type: "image",
      props: { src: `https://picsum.photos/seed/${article.seed}/800/500`, alt: article.title },
      style: { borderRadius: "10px", margin: "0 0 12px" },
    });
    addHeading(doc, column, article.title, 3, { fontSize: "19px", margin: "0 0 8px" });
    addText(doc, column, article.body, { fontSize: "14px" });
    add(doc, column, { type: "link", props: { text: "Baca artikel", href: "#" } });
  }

  addFooter(doc, "Ditulis oleh Dimas · Jakarta", { color: "#64748b" });
  return doc;
}

export function buildProductLaunch(): BuilderDocument {
  const doc = withInter(createEmptyDocument("Product Launch"));
  addNavbar(doc, { brand: "Auralite", items: [
    { label: "Produk", href: "#" },
    { label: "Spesifikasi", href: "#" },
    { label: "Beli", href: "#" },
  ] });

  const hero = addSection(doc, doc.rootId, {
    props: {
      backgroundImage: "https://picsum.photos/seed/device/1600/900",
      backgroundSize: "cover",
      backgroundPosition: "center",
      overlayColor: "#0f172a",
      overlayOpacity: 35,
      minHeight: "440px",
    },
    style: { padding: "72px 24px", borderRadius: "12px", margin: "24px 0" },
  });
  addHeading(doc, hero, "Auralite Studio: suara jernih tanpa kabel", 1, {
    fontSize: "40px",
    color: "#ffffff",
    maxWidth: "640px",
    margin: "0 0 16px",
  });
  addText(doc, hero, "Baterai 24 jam, peredam bising adaptif, dan kasing yang siap dibawa ke mana saja.", {
    color: "#e2e8f0",
    fontSize: "18px",
    maxWidth: "560px",
  });
  addButton(doc, hero, "Pesan Sekarang", { style: { backgroundColor: "#f8fafc", color: "#0f172a" } });

  const detail = addSection(doc, doc.rootId, { style: { padding: "40px 24px" } });
  const columns = addColumns(doc, detail, 2, "24px");
  const imageColumn = addColumn(doc, columns, { padding: "0" });
  add(doc, imageColumn, {
    type: "image",
    props: { src: "https://picsum.photos/seed/device-detail/900/700", alt: "Auralite Studio" },
    style: { borderRadius: "12px", width: "100%" },
  });

  const textColumn = addColumn(doc, columns);
  addHeading(doc, textColumn, "Dirancang untuk dipakai sepanjang hari", 2, { fontSize: "28px", margin: "0 0 12px" });
  addText(doc, textColumn, "Driver 40mm menghasilkan bass yang dalam tanpa mengorbankan vokal. Mode transparansi memudahkan percakapan singkat.");
  addText(doc, textColumn, "Kasing dilapisi kain daur ulang dan tahan tetes air.");
  addButton(doc, textColumn, "Lihat Spesifikasi");

  const specs = addSection(doc, doc.rootId, { style: { padding: "0 24px 40px" } });
  const specColumns = addColumns(doc, specs, 3, "16px");
  const specsData = [
    { title: "24 jam", body: "pemakaian dengan sekali isi" },
    { title: "38 ms", body: "latensi untuk gaming" },
    { title: "38 g", body: "ringan di telinga" },
  ];
  for (const spec of specsData) {
    const column = addColumn(doc, specColumns, { backgroundColor: "#f8fafc", borderRadius: "10px", textAlign: "center" });
    addHeading(doc, column, spec.title, 3, { fontSize: "22px", margin: "0 0 4px" });
    addText(doc, column, spec.body, { textAlign: "center" });
  }

  addFooter(doc, "Auralite · Garansi resmi 2 tahun", { textAlign: "center", color: "#64748b" });
  return doc;
}

export function buildEvent(): BuilderDocument {
  const doc = withInter(createEmptyDocument("Event Webinar"));
  addNavbar(doc, { brand: "Ruang Belajar", items: [
    { label: "Agenda", href: "#" },
    { label: "Pembicara", href: "#" },
    { label: "Daftar", href: "#" },
  ] });

  const hero = addSection(doc, doc.rootId, {
    style: {
      backgroundImage: "linear-gradient(120deg,#0f172a,#0ea5e9)",
      color: "#f8fafc",
      padding: "56px 24px",
      borderRadius: "12px",
      margin: "24px 0",
    },
  });
  addHeading(doc, hero, "Webinar: Membangun Produk AI yang Bertanggung Jawab", 1, {
    fontSize: "38px",
    lineHeight: "1.15",
    color: "#f8fafc",
    maxWidth: "760px",
    margin: "0 0 12px",
  });
  addText(doc, hero, "Kamis, 12 Maret 2026 · 19.00 WIB · Gratis untuk 500 peserta pertama.", {
    color: "#e0f2fe",
    fontSize: "17px",
  });
  addButton(doc, hero, "Daftar Sekarang", { style: { backgroundColor: "#f8fafc", color: "#0f172a" } });

  const agenda = addSection(doc, doc.rootId, { style: { padding: "40px 24px" } });
  addHeading(doc, agenda, "Agenda", 2, { fontSize: "28px", margin: "0 0 20px" });
  const columns = addColumns(doc, agenda, 3);
  const agendaData = [
    { time: "19.00", title: "Membuka sesi", body: "Konteks dan tujuan webinar." },
    { time: "19.15", title: "Studi kasus", body: "Dari prototipe ke rilis tanpa insiden." },
    { time: "20.00", title: "Tanya jawab", body: "Sesi terbuka untuk peserta." },
  ];
  for (const item of agendaData) {
    const column = addColumn(doc, columns, { backgroundColor: "#f8fafc", borderRadius: "10px", padding: "20px" });
    addHeading(doc, column, item.time, 3, { color: "#0369a1", fontSize: "18px", margin: "0 0 4px" });
    addText(doc, column, item.title, { color: "#0f172a", fontWeight: "600" });
    addText(doc, column, item.body, { fontSize: "14px" });
  }

  addFooter(doc, "Diselenggarakan oleh Ruang Belajar", { textAlign: "center", color: "#64748b" });
  return doc;
}

export function buildRestaurant(): BuilderDocument {
  const doc = withInter(createEmptyDocument("Restoran Kafe"));
  addNavbar(doc, { brand: "Kedai Senja", items: [
    { label: "Menu", href: "#" },
    { label: "Lokasi", href: "#" },
    { label: "Reservasi", href: "#" },
  ] });

  const hero = addSection(doc, doc.rootId, {
    props: {
      backgroundImage: "https://picsum.photos/seed/coffee-shop/1600/900",
      backgroundSize: "cover",
      backgroundPosition: "center",
      overlayColor: "#1c1917",
      overlayOpacity: 40,
      minHeight: "420px",
    },
    style: { padding: "72px 24px", borderRadius: "12px", margin: "24px 0" },
  });
  addHeading(doc, hero, "Kopi, roti, dan ruang untuk berlama-lama", 1, {
    fontSize: "42px",
    color: "#ffffff",
    maxWidth: "620px",
    margin: "0 0 12px",
  });
  addText(doc, hero, "Buka setiap hari 08.00–22.00 di Jalan Kemang Raya No. 12, Jakarta.", {
    color: "#f5f5f4",
    fontSize: "17px",
  });
  addButton(doc, hero, "Lihat Menu", { style: { backgroundColor: "#fbbf24", color: "#1c1917" } });

  const menu = addSection(doc, doc.rootId, { style: { padding: "40px 24px" } });
  addHeading(doc, menu, "Menu favorit", 2, { fontSize: "28px", margin: "0 0 20px" });
  const columns = addColumns(doc, menu, 3);
  const menuData = [
    { name: "Es Kopi Susu", price: "Rp 28.000", body: "Espresso, susu segar, dan gula aren." },
    { name: "Croissant Butter", price: "Rp 32.000", body: "Dipanggang setiap pagi, renyah di luar." },
    { name: "Matcha Latte", price: "Rp 34.000", body: "Matcha Uji dengan susu oat." },
  ];
  for (const item of menuData) {
    const column = addColumn(doc, columns, {
      border: "1px solid #e7e5e4",
      borderRadius: "12px",
      padding: "20px",
    });
    addHeading(doc, column, item.name, 3, { fontSize: "20px", margin: "0 0 4px" });
    addText(doc, column, item.price, { color: "#b45309", fontWeight: "600", margin: "0 0 8px" });
    addText(doc, column, item.body, { fontSize: "14px" });
  }

  addFooter(doc, "Kedai Senja · Senin–Minggu 08.00–22.00 · +62 812 0000 0000", {
    textAlign: "center",
    color: "#78716c",
  });
  return doc;
}

export function buildPricing(): BuilderDocument {
  const doc = withInter(createEmptyDocument("Halaman Pricing"));
  addNavbar(doc, { brand: "Banyak Akal", items: [
    { label: "Fitur", href: "#" },
    { label: "Harga", href: "#" },
    { label: "Kontak", href: "#" },
  ] });

  const intro = addSection(doc, doc.rootId, { style: { padding: "48px 24px 24px", textAlign: "center" } });
  addHeading(doc, intro, "Harga sederhana, tanpa kejutan", 1, { fontSize: "38px", margin: "0 0 12px" });
  addText(doc, intro, "Pilih paket sesuai ukuran tim. Semua paket termasuk pembaruan dan dukungan email.", {
    textAlign: "center",
    fontSize: "17px",
  });

  const plans = addSection(doc, doc.rootId, { style: { padding: "16px 24px 48px" } });
  const columns = addColumns(doc, plans, 3);
  const plansData = [
    { name: "Starter", price: "Rp 0", note: "untuk 3 anggota", body: "Cukup untuk mencoba alur kerja dasar.", featured: false },
    { name: "Growth", price: "Rp 249.000", note: "per bulan", body: "Kolaborasi penuh, otomatisasi, dan analitik.", featured: true },
    { name: "Scale", price: "Rp 799.000", note: "per bulan", body: "Kontrol akses lanjutan dan dukungan prioritas.", featured: false },
  ];

  for (const plan of plansData) {
    const column = addColumn(doc, columns, {
      padding: "28px",
      borderRadius: "14px",
      border: "1px solid #e2e8f0",
      backgroundColor: plan.featured ? "#0f172a" : "#ffffff",
      color: plan.featured ? "#f8fafc" : "#0f172a",
    });
    addHeading(doc, column, plan.name, 3, {
      fontSize: "20px",
      margin: "0 0 8px",
      color: plan.featured ? "#f8fafc" : "#0f172a",
    });
    addHeading(doc, column, plan.price, 2, {
      fontSize: "30px",
      margin: "0 0 4px",
      color: plan.featured ? "#f8fafc" : "#0f172a",
    });
    addText(doc, column, plan.note, {
      color: plan.featured ? "#cbd5e1" : "#64748b",
      fontSize: "14px",
    });
    addText(doc, column, plan.body, { color: plan.featured ? "#e2e8f0" : "#334155", fontSize: "15px" });
    addButton(doc, column, plan.featured ? "Pilih Growth" : "Pilih Paket");
  }

  addFooter(doc, "© 2026 Banyak Akal. Harga belum termasuk PPN.", { textAlign: "center", color: "#64748b" });
  return doc;
}

export function buildEmptyTemplate(): BuilderDocument {
  return createEmptyDocument("Halaman Kosong");
}

export type TemplateSeed = { name: string; description: string; content: BuilderDocument };

export const SEED_TEMPLATES: TemplateSeed[] = [
  {
    name: "SaaS Landing",
    description: "Hero bergradasi biru, tiga kartu fitur, CTA gelap, dan footer.",
    content: buildSaasLanding(),
  },
  {
    name: "Portfolio Minimal",
    description: "Hero foto dengan overlay, galeri tiga karya, tipografi besar.",
    content: buildPortfolioMinimal(),
  },
  {
    name: "Agency Kreatif",
    description: "Hero background studio, empat layanan dalam dua kolom.",
    content: buildAgency(),
  },
  {
    name: "Startup Launch",
    description: "Hero ungu, statistik empat kolom, alur kerja tiga langkah.",
    content: buildStartupLaunch(),
  },
  {
    name: "Personal Blog",
    description: "Judul besar, tiga kartu artikel dengan gambar, tautan baca.",
    content: buildPersonalBlog(),
  },
  {
    name: "Product Launch",
    description: "Hero produk dengan overlay, detail dua kolom, tiga spesifikasi.",
    content: buildProductLaunch(),
  },
  {
    name: "Event Webinar",
    description: "Hero gradient biru, agenda tiga kolom, ajakan daftar.",
    content: buildEvent(),
  },
  {
    name: "Restoran Kafe",
    description: "Hero foto kafe, tiga menu favorit dengan harga, jam buka.",
    content: buildRestaurant(),
  },
  {
    name: "Halaman Pricing",
    description: "Tiga paket harga, paket unggulan ditonjolkan dengan kartu gelap.",
    content: buildPricing(),
  },
  {
    name: "Halaman Kosong",
    description: "Mulai dari nol dengan satu container kosong.",
    content: buildEmptyTemplate(),
  },
];
