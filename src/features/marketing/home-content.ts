/**
 * Static marketing copy untuk halaman Home.
 *
 * Semua data di sini sengaja ditulis manual (bukan dibaca dari database) supaya
 * halaman publik tetap cepat, stabil, dan tidak bergantung pada data seed.
 */

export const TRUST_POINTS = [
  "Gratis untuk mulai",
  "Export HTML",
  "Provider AI milik Anda",
] as const;

export type AiFlowStep = {
  title: string;
  description: string;
};

export const AI_FLOW_STEPS: AiFlowStep[] = [
  {
    title: "Tulis prompt",
    description:
      "Jelaskan halaman yang Anda butuhkan dengan bahasa sehari-hari: tujuan, nuansa, dan bagian yang harus ada. Maksimal 4.000 karakter per prompt.",
  },
  {
    title: "AI menyusun JSON komponen",
    description:
      "Hasil AI bukan HTML mentah, melainkan daftar blok (hero, heading, teks, tombol) yang divalidasi skema sebelum dipakai.",
  },
  {
    title: "Pratinjau di kanvas",
    description:
      "Blok hasil AI dirender dengan komponen yang sama seperti saat Anda menyusun manual, jadi tampilannya tidak berbeda.",
  },
  {
    title: "Terapkan lalu sunting",
    description:
      "Terapkan ke halaman, rapikan teks dan gaya per blok. Salah langkah? Undo. Setelahnya autosave menyimpan perubahan.",
  },
];

export type ProviderItem = {
  name: string;
  mark: string;
  note: string;
};

export const AI_PROVIDERS: ProviderItem[] = [
  { name: "OpenAI", mark: "OA", note: "Cloud · api.openai.com" },
  { name: "OpenRouter", mark: "OR", note: "Cloud · openrouter.ai" },
  { name: "Groq", mark: "GQ", note: "Cloud · api.groq.com" },
  { name: "DeepSeek", mark: "DS", note: "Cloud · api.deepseek.com" },
  { name: "Ollama", mark: "OL", note: "Lokal · localhost:11434" },
  { name: "LM Studio", mark: "LM", note: "Lokal · localhost:1234" },
];

export type FeatureItem = {
  title: string;
  description: string;
};

export const EDITOR_FEATURES: FeatureItem[] = [
  {
    title: "Drag & drop",
    description:
      "Tarik blok dari palette ke kanvas, ubah urutannya, lalu duplikasi atau hapus dari toolbar blok.",
  },
  {
    title: "Latar gradasi",
    description:
      "Isi latar section atau hero dengan linear, radial, atau conic gradient langsung dari panel properti.",
  },
  {
    title: "Gambar latar + overlay",
    description:
      "Pasang URL gambar, pilih ukuran cover atau contain, atur posisi fokus, lalu lapisi warna overlay dengan opacity.",
  },
  {
    title: "Navbar dengan logo",
    description:
      "Ganti nama brand dengan logo dari URL, atur lebar dan alt-nya, serta kelola hingga delapan item menu.",
  },
  {
    title: "Font kustom",
    description:
      "Impor font dari URL WOFF2, WOFF, TTF, atau OTF. Maksimal tiga font per halaman dengan pilihan weight.",
  },
  {
    title: "Autosave",
    description:
      "Perubahan tersimpan otomatis dua detik setelah Anda berhenti mengedit, dengan indikator Menyimpan dan Tersimpan.",
  },
  {
    title: "Riwayat versi",
    description:
      "Snapshot dibuat saat export atau manual. Pulihkan versi lama kapan saja, maksimal 30 versi per halaman.",
  },
  {
    title: "Export HTML",
    description:
      "Unduh halaman sebagai satu file HTML berisi markup dan CSS inline, termasuk aturan @font-face.",
  },
];

export type TemplateSketch = "saas" | "portfolio" | "agency" | "startup" | "cafe" | "pricing";

export type TemplateCardItem = {
  name: string;
  category: string;
  description: string;
  sketch: TemplateSketch;
  accent: string;
};

export const TEMPLATE_CARDS: TemplateCardItem[] = [
  {
    name: "SaaS Landing",
    category: "Landing",
    description: "Hero bergradasi biru, tiga kartu fitur, CTA gelap, dan footer.",
    sketch: "saas",
    accent: "from-blue-600 to-sky-400",
  },
  {
    name: "Portfolio Minimal",
    category: "Portofolio",
    description: "Hero foto dengan overlay, galeri tiga karya, tipografi besar.",
    sketch: "portfolio",
    accent: "from-slate-700 to-slate-400",
  },
  {
    name: "Agency Kreatif",
    category: "Agensi",
    description: "Hero dengan gambar studio, empat layanan dalam dua kolom.",
    sketch: "agency",
    accent: "from-blue-700 to-indigo-500",
  },
  {
    name: "Startup Launch",
    category: "Startup",
    description: "Hero ungu, statistik empat kolom, dan alur kerja tiga langkah.",
    sketch: "startup",
    accent: "from-indigo-600 to-violet-500",
  },
  {
    name: "Restoran Kafe",
    category: "Kuliner",
    description: "Hero foto kafe, tiga menu favorit dengan harga, dan jam buka.",
    sketch: "cafe",
    accent: "from-sky-700 to-cyan-500",
  },
  {
    name: "Halaman Pricing",
    category: "Pricing",
    description: "Tiga paket harga dengan paket unggulan ditonjolkan.",
    sketch: "pricing",
    accent: "from-slate-900 to-blue-700",
  },
];

export type SecurityItem = {
  title: string;
  description: string;
};

export const SECURITY_ITEMS: SecurityItem[] = [
  {
    title: "Data terpisah per pemilik",
    description:
      "Setiap query project, page, dan versi difilter dengan ID pemilik. Data milik orang lain dijawab 404, bukan 403, agar keberadaannya tidak bocor.",
  },
  {
    title: "Revisi tidak saling menimpa",
    description:
      "Simpan membawa nomor revisi. Bila halaman berubah di tab lain, editor menampilkan konflik, bukan menimpa diam-diam.",
  },
  {
    title: "HTML tanpa script",
    description:
      "Export dirender dari komponen tervalidasi: tanpa tag script, tanpa atribut event, dan tautan javascript: ditolak.",
  },
  {
    title: "Kunci AI terenkripsi",
    description:
      "API key provider dienkripsi AES-256-GCM di server dan tidak pernah dikirim kembali ke browser.",
  },
];

export type UseCaseItem = {
  title: string;
  description: string;
};

export const USE_CASES: UseCaseItem[] = [
  {
    title: "SaaS",
    description: "Halaman fitur, harga, dan pendaftaran untuk produk berlangganan.",
  },
  {
    title: "Portofolio",
    description: "Sorotan karya desainer, fotografer, atau penulis lepas.",
  },
  {
    title: "Agensi",
    description: "Profil layanan, proses kerja, dan halaman studi kasus.",
  },
  {
    title: "Restoran & acara",
    description: "Menu, jam buka, suasana tempat, dan agenda acara.",
  },
  {
    title: "Peluncuran produk",
    description: "Halaman satu waktu untuk memperkenalkan produk baru.",
  },
];

export type FaqItem = {
  question: string;
  answer: string;
};

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Apakah saya harus bisa coding?",
    answer:
      "Tidak. Semua blok disusun lewat editor visual: tarik blok, ubah teks, atur warna dan jarak. HTML dan CSS dihasilkan otomatis saat export.",
  },
  {
    question: "Provider AI apa saja yang didukung?",
    answer:
      "Provider apa pun yang kompatibel dengan API OpenAI. Preset yang tersedia: OpenAI, OpenRouter, Groq, DeepSeek, serta Ollama dan LM Studio untuk model lokal di komputer Anda.",
  },
  {
    question: "Apakah API key saya aman?",
    answer:
      "Key dienkripsi AES-256-GCM di server dan hanya ditampilkan dalam bentuk tersamarkan. Key tidak pernah dikirim balik ke browser, dan permintaan ke provider dilakukan dari server.",
  },
  {
    question: "Bisakah saya export HTML?",
    answer:
      "Bisa. Setiap halaman dapat diunduh sebagai satu file .html berisi markup dan CSS inline. Setelah itu bebas diunggah ke hosting pilihan Anda.",
  },
  {
    question: "Apakah AI menulis HTML mentah?",
    answer:
      "Tidak. AI mengembalikan JSON komponen yang divalidasi skema. Nilai di luar whitelist ditolak, sehingga hasilnya selalu bisa dirender oleh editor dan siap di-export.",
  },
];
