import clsx from "clsx";
import Link from "next/link";

import {
  AI_FLOW_STEPS,
  AI_PROVIDERS,
  EDITOR_FEATURES,
  FAQ_ITEMS,
  SECURITY_ITEMS,
  TEMPLATE_CARDS,
  TRUST_POINTS,
  USE_CASES,
  type TemplateSketch,
} from "./home-content";

const CTA_BASE =
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-xl px-5 py-3 text-sm font-semibold shadow-sm transition-colors";

const CTA_PRIMARY = `${CTA_BASE} bg-blue-600 text-white hover:bg-blue-700`;

const CTA_SECONDARY = `${CTA_BASE} border border-slate-300 bg-white text-slate-800 hover:bg-slate-100`;

const CTA_ON_DARK_PRIMARY = `${CTA_BASE} bg-white text-slate-900 hover:bg-slate-100`;

const CTA_ON_DARK_SECONDARY = `${CTA_BASE} border border-white/30 text-white hover:bg-white/10`;

const PROVIDER_NOTES = [
  "Base URL dan API key diisi sendiri di halaman pengaturan, lalu koneksinya diuji sebelum benar-benar disimpan.",
  "Key dienkripsi AES-256-GCM di server. Browser hanya menerima info provider dan versi tersamarkan, bukan key aslinya.",
  "Daftar model bisa diambil otomatis dari endpoint GET /models, atau diisi manual bila provider tidak menyediakannya.",
];

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

function Section({
  id,
  tone = "base",
  children,
}: {
  id?: string;
  tone?: "base" | "white";
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={clsx(
        "scroll-mt-16 py-16 sm:py-24",
        tone === "white" ? "border-y border-slate-200 bg-white" : "bg-transparent",
      )}
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">{children}</div>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  center = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  center?: boolean;
}) {
  return (
    <div className={clsx("max-w-2xl", center && "mx-auto text-center")}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
      {description ? (
        <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">{description}</p>
      ) : null}
    </div>
  );
}

function BulletList({ items, className }: { items: readonly string[]; className?: string }) {
  return (
    <ul className={clsx("space-y-3 text-sm leading-relaxed text-slate-600", className)}>
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

function EditorMockPalette() {
  return (
    <div className="rounded-lg bg-white/5 p-2 ring-1 ring-white/10">
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/50">Blok</p>
      <ul className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-1">
        {["Heading", "Teks", "Gambar", "Tombol", "Hero", "Navbar"].map((label, index) => (
          <li
            key={label}
            className={clsx(
              "flex items-center gap-1.5 rounded-md px-1.5 py-1",
              index === 4 ? "bg-blue-500/25 ring-1 ring-blue-400/40" : "bg-white/5",
            )}
          >
            <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-[2px] bg-blue-300/70" />
            <span className="truncate text-[9px] text-white/70">{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EditorMockCanvas() {
  return (
    <div className="min-w-0 rounded-lg bg-white p-2 shadow-sm">
      <div className="flex items-center justify-between gap-2 rounded-md border border-slate-200 px-2 py-1.5">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-3 rounded-sm bg-blue-600" />
          <span aria-hidden="true" className="h-1.5 w-10 rounded-full bg-slate-300" />
        </span>
        <span className="flex items-center gap-1">
          <span aria-hidden="true" className="h-1 w-4 rounded-full bg-slate-200" />
          <span aria-hidden="true" className="h-1 w-4 rounded-full bg-slate-200" />
          <span aria-hidden="true" className="h-1 w-4 rounded-full bg-slate-300" />
        </span>
      </div>

      <div className="mt-2 rounded-md bg-linear-to-br from-blue-600 to-sky-400 p-3 ring-2 ring-blue-500/40 ring-offset-1">
        <span aria-hidden="true" className="block h-1.5 w-8 rounded-full bg-white/50" />
        <span aria-hidden="true" className="mt-2 block h-2.5 w-4/5 rounded-full bg-white/90" />
        <span aria-hidden="true" className="mt-1.5 block h-2 w-3/5 rounded-full bg-white/70" />
        <span aria-hidden="true" className="mt-2 block h-1.5 w-3/4 rounded-full bg-white/40" />
        <span className="mt-3 inline-block rounded-full bg-white px-2.5 py-1 text-[8px] font-semibold text-blue-700">
          Mulai
        </span>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {[0, 1].map((index) => (
          <div key={index} className="rounded-md border border-slate-200 p-2">
            <span aria-hidden="true" className="block h-1.5 w-6 rounded-full bg-slate-300" />
            <span aria-hidden="true" className="mt-1.5 block h-1 w-full rounded-full bg-slate-200" />
            <span aria-hidden="true" className="mt-1 block h-1 w-2/3 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>

      <span aria-hidden="true" className="mt-2 block h-1 w-1/3 rounded-full bg-slate-100" />
    </div>
  );
}

function EditorMockInspector() {
  return (
    <div className="hidden min-w-0 rounded-lg bg-white/5 p-2 ring-1 ring-white/10 lg:block">
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/50">Properti</p>
      <div className="mt-2 space-y-2">
        <div>
          <span className="block text-[8px] uppercase tracking-wide text-white/40">Teks</span>
          <span aria-hidden="true" className="mt-1 block h-4 rounded-sm bg-white/10" />
        </div>
        <div>
          <span className="block text-[8px] uppercase tracking-wide text-white/40">Level</span>
          <span className="mt-1 flex items-center justify-between rounded-sm bg-white/10 px-1.5 py-1">
            <span className="text-[8px] text-white/70">H2</span>
            <span aria-hidden="true" className="text-[8px] text-white/40">v</span>
          </span>
        </div>
        <div>
          <span className="block text-[8px] uppercase tracking-wide text-white/40">Warna</span>
          <span className="mt-1 flex gap-1">
            {["bg-white", "bg-blue-400", "bg-sky-300", "bg-slate-500"].map((swatch) => (
              <span key={swatch} aria-hidden="true" className={clsx("h-3 w-3 rounded-sm", swatch)} />
            ))}
          </span>
        </div>
        <div>
          <span className="block text-[8px] uppercase tracking-wide text-white/40">Latar</span>
          <span aria-hidden="true" className="mt-1 block h-3 rounded-sm bg-linear-to-r from-blue-500 to-sky-300" />
        </div>
      </div>
    </div>
  );
}

function EditorMock() {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="relative overflow-hidden rounded-2xl bg-linear-to-br from-slate-950 via-slate-900 to-blue-700 p-3 shadow-2xl shadow-slate-900/25 sm:p-4"
      >
        <div className="flex items-center justify-between gap-2 pb-3">
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-white/30" />
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-white/20" />
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-white/10" />
          </span>
          <span aria-hidden="true" className="h-5 w-24 rounded-full bg-white/10 sm:w-32" />
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2 py-1">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[9px] font-medium text-emerald-200">Tersimpan</span>
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[76px_minmax(0,1fr)] lg:grid-cols-[76px_minmax(0,1fr)_88px]">
          <EditorMockPalette />
          <EditorMockCanvas />
          <EditorMockInspector />
        </div>
      </div>

      <div
        aria-hidden="true"
        className="absolute -bottom-4 left-4 hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm sm:flex"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
        <span className="text-[11px] font-medium text-slate-600">Kanvas 3 panel · desktop, tablet, mobile</span>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-linear-to-b from-blue-100/70 via-blue-50/40 to-slate-50"
      />
      <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-4 pb-20 pt-12 sm:px-6 sm:pb-28 sm:pt-16 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-medium text-blue-700 shadow-sm">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            Editor visual + AI, satu sistem komponen
          </span>

          <h1 className="mt-6 text-3xl font-bold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl">
            Buat halaman web dari drag &amp; drop atau{" "}
            <span className="text-blue-700">satu prompt</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Editor visual dan AI memakai sistem komponen yang sama. Halaman yang Anda susun manual
            pun bisa dihasilkan dari satu prompt, lalu tetap bebas dirapikan blok per blok.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className={CTA_PRIMARY}>
              Mulai Gratis
            </Link>
            <Link href="/login" className={CTA_SECONDARY}>
              Masuk
            </Link>
          </div>

          <ul className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-500 sm:text-sm">
            {TRUST_POINTS.map((point, index) => (
              <li key={point} className="flex items-center gap-3">
                {index > 0 ? (
                  <span aria-hidden="true" className="h-1 w-1 rounded-full bg-slate-300" />
                ) : null}
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <EditorMock />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* AI Prompt Builder                                                   */
/* ------------------------------------------------------------------ */

function PromptCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900">Prompt</p>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
          Contoh
        </span>
      </div>
      <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
        Landing page SaaS dengan hero bergradasi biru, tiga kartu fitur, bagian harga, dan tombol
        ajakan mulai gratis.
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium text-slate-600">
        <span className="rounded-full border border-slate-200 px-2.5 py-1">Gaya: Minimal</span>
        <span className="rounded-full border border-slate-200 px-2.5 py-1">Bahasa: Indonesia</span>
      </div>
    </div>
  );
}

function PreviewCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900">Pratinjau</p>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">
          JSON tervalidasi
        </span>
      </div>

      <div aria-hidden="true" className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="rounded-md bg-linear-to-br from-blue-700 via-blue-600 to-sky-400 p-3">
          <span className="block h-1.5 w-8 rounded-full bg-white/40" />
          <span className="mt-2 block h-2.5 w-4/5 rounded-full bg-white/90" />
          <span className="mt-1.5 block h-2 w-3/5 rounded-full bg-white/60" />
          <span className="mt-2.5 inline-block rounded-full bg-white px-2 py-1 text-[8px] font-semibold text-blue-700">
            Mulai gratis
          </span>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {[0, 1, 2].map((index) => (
            <div key={index} className="rounded-md bg-white p-2 ring-1 ring-slate-200">
              <span className="block h-1 w-1 rounded-[2px] bg-blue-500" />
              <span className="mt-1.5 block h-1 w-full rounded-full bg-slate-200" />
              <span className="mt-1 block h-1 w-2/3 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Blok hasil AI: section, hero, columns, heading, text, button.
      </p>
    </div>
  );
}

export function AiBuilderSection() {
  return (
    <Section id="cara-kerja" tone="white">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-16">
        <div>
          <SectionHeading
            eyebrow="AI Prompt Builder"
            title="Dari satu prompt menjadi blok yang bisa Anda sunting"
            description="Empat langkah, tanpa menempel HTML dari tempat lain."
          />

          <ol className="mt-8 space-y-6">
            {AI_FLOW_STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-sm font-semibold text-blue-700">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/register" className={CTA_PRIMARY}>
              Coba di editor
            </Link>
            <p className="text-xs leading-relaxed text-slate-500 sm:text-sm">
              Butuh akun untuk menyimpan halaman. Undo dan autosave aktif otomatis.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <PromptCard />
          <div aria-hidden="true" className="mx-auto h-5 w-px bg-slate-300" />
          <PreviewCard />
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Providers                                                           */
/* ------------------------------------------------------------------ */

export function ProviderSection() {
  return (
    <Section id="provider-ai">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>
          <SectionHeading
            eyebrow="Provider AI milik Anda"
            title="Bawa API key sendiri, pilih model sendiri"
            description="Web Builder tidak menjual kredit AI. Anda menghubungkan provider yang kompatibel dengan API OpenAI, dan pemakaian tetap berada di akun provider Anda."
          />

          <BulletList items={PROVIDER_NOTES} className="mt-6" />

          <div className="mt-8">
            <Link href="/settings/ai" className={CTA_PRIMARY}>
              Atur provider
            </Link>
            <p className="mt-3 text-xs text-slate-500">
              Perlu akun — Anda akan diarahkan untuk masuk terlebih dahulu.
            </p>
          </div>
        </div>

        <div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {AI_PROVIDERS.map((provider) => (
              <li
                key={provider.name}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-semibold tracking-wide text-white"
                >
                  {provider.mark}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900">{provider.name}</span>
                  <span className="block truncate text-xs text-slate-500">{provider.note}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            Model lokal seperti Ollama dan LM Studio dapat dipakai saat pengembangan. Untuk
            produksi, gunakan endpoint HTTPS.
          </p>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Editor features                                                     */
/* ------------------------------------------------------------------ */

export function EditorFeaturesSection() {
  return (
    <Section id="fitur" tone="white">
      <SectionHeading
        eyebrow="Editor visual"
        title="Kontrol tampilan tanpa menyentuh CSS"
        description="Semua yang terlihat di kanvas berasal dari blok dan gaya yang diizinkan, jadi hasil export selalu konsisten dengan pratinjau."
      />

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {EDITOR_FEATURES.map((feature) => (
          <li key={feature.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <span aria-hidden="true" className="block h-1 w-8 rounded-full bg-blue-600" />
            <h3 className="mt-4 text-base font-semibold text-slate-900">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Templates                                                           */
/* ------------------------------------------------------------------ */

function TemplateSketchPreview({ sketch, accent }: { sketch: TemplateSketch; accent: string }) {
  return (
    <div aria-hidden="true" className="h-44 overflow-hidden rounded-lg border border-slate-200 bg-white p-3">
      {sketch === "saas" ? (
        <>
          <div className="flex items-center justify-between">
            <span className="h-1.5 w-8 rounded-full bg-slate-800" />
            <span className="flex gap-1">
              <span className="h-1 w-4 rounded-full bg-slate-200" />
              <span className="h-1 w-4 rounded-full bg-slate-200" />
              <span className="h-1 w-4 rounded-full bg-slate-300" />
            </span>
          </div>
          <div className={clsx("mt-2.5 rounded-md bg-linear-to-br p-3", accent)}>
            <span className="block h-1.5 w-10 rounded-full bg-white/50" />
            <span className="mt-2 block h-2.5 w-4/5 rounded-full bg-white/90" />
            <span className="mt-1.5 block h-1.5 w-3/5 rounded-full bg-white/60" />
            <span className="mt-2 inline-block h-2.5 w-10 rounded-full bg-white" />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {[0, 1, 2].map((index) => (
              <div key={index} className="rounded-md border border-slate-200 p-1.5">
                <span className="block h-1 w-1 rounded-full bg-blue-500" />
                <span className="mt-1 block h-1 w-full rounded-full bg-slate-200" />
                <span className="mt-1 block h-1 w-2/3 rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        </>
      ) : null}

      {sketch === "portfolio" ? (
        <>
          <div className="flex justify-center">
            <span className={clsx("h-7 w-7 rounded-full bg-linear-to-br", accent)} />
          </div>
          <div className="mx-auto mt-2 h-1.5 w-16 rounded-full bg-slate-800" />
          <div className="mx-auto mt-1.5 h-1 w-10 rounded-full bg-slate-300" />
          <div className="mt-3 space-y-1.5">
            <div className="h-8 rounded-md border border-slate-200 bg-slate-50" />
            <div className="h-8 rounded-md border border-slate-200 bg-slate-50" />
          </div>
        </>
      ) : null}

      {sketch === "agency" ? (
        <div className="grid h-full grid-cols-2 gap-2">
          <div className={clsx("rounded-md bg-linear-to-br", accent)}>
            <span className="mt-8 block h-1 w-8 rounded-full bg-white/50" />
          </div>
          <div className="space-y-1.5">
            <span className="block h-2 w-full rounded-full bg-slate-800" />
            <span className="block h-1 w-4/5 rounded-full bg-slate-300" />
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {[0, 1, 2, 3].map((index) => (
                <span key={index} className="block h-6 rounded border border-slate-200 bg-slate-50" />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {sketch === "startup" ? (
        <>
          <div className={clsx("rounded-md bg-linear-to-br p-3 text-center", accent)}>
            <span className="mx-auto block h-1.5 w-12 rounded-full bg-white/50" />
            <span className="mx-auto mt-2 block h-2.5 w-3/4 rounded-full bg-white/90" />
            <span className="mx-auto mt-1.5 block h-1 w-1/2 rounded-full bg-white/60" />
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="rounded border border-slate-200 p-1.5 text-center">
                <span className="mx-auto block h-1.5 w-4 rounded-full bg-slate-400" />
                <span className="mx-auto mt-1 block h-1 w-6 rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-1.5">
            {[0, 1, 2].map((index) => (
              <span key={index} className="block h-4 flex-1 rounded bg-slate-100" />
            ))}
          </div>
        </>
      ) : null}

      {sketch === "cafe" ? (
        <div className="grid h-full grid-cols-2 gap-2">
          <div className={clsx("relative rounded-md bg-linear-to-br", accent)}>
            <span className="absolute bottom-2 left-2 h-1 w-8 rounded-full bg-white/60" />
          </div>
          <div className="space-y-2">
            <span className="block h-1.5 w-10 rounded-full bg-slate-800" />
            {[0, 1, 2].map((index) => (
              <div key={index} className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1">
                <span className="block h-1 w-10 rounded-full bg-slate-300" />
                <span className="block h-1 w-4 rounded-full bg-blue-400" />
              </div>
            ))}
            <span className="block h-1 w-8 rounded-full bg-slate-200" />
          </div>
        </div>
      ) : null}

      {sketch === "pricing" ? (
        <>
          <span className="mx-auto block h-1.5 w-16 rounded-full bg-slate-800" />
          <div className="mt-3 grid grid-cols-3 items-start gap-1.5">
            <div className="mt-2 space-y-1 rounded border border-slate-200 p-1.5">
              <span className="block h-1 w-full rounded-full bg-slate-300" />
              <span className="block h-1.5 w-6 rounded-full bg-slate-400" />
              <span className="block h-1 w-full rounded-full bg-slate-100" />
            </div>
            <div className={clsx("space-y-1 rounded border-0 bg-linear-to-br p-2", accent)}>
              <span className="block h-1 w-full rounded-full bg-white/60" />
              <span className="block h-2 w-8 rounded-full bg-white" />
              <span className="block h-1 w-full rounded-full bg-white/40" />
              <span className="block h-2 w-full rounded-full bg-white/90" />
            </div>
            <div className="mt-2 space-y-1 rounded border border-slate-200 p-1.5">
              <span className="block h-1 w-full rounded-full bg-slate-300" />
              <span className="block h-1.5 w-6 rounded-full bg-slate-400" />
              <span className="block h-1 w-full rounded-full bg-slate-100" />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function TemplatesSection() {
  return (
    <Section id="template">
      <SectionHeading
        eyebrow="Template"
        title="Mulai dari template, bukan dari nol"
        description="Enam template kurasi yang bisa langsung dipakai saat membuat page baru. Semua blok tetap bisa diubah sesuai brand Anda."
      />

      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATE_CARDS.map((template) => (
          <li
            key={template.name}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            <div aria-hidden="true" className={clsx("h-1 w-full bg-linear-to-r", template.accent)} />
            <div className="p-3">
              <TemplateSketchPreview sketch={template.sketch} accent={template.accent} />
              <div className="px-2 pb-1 pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">
                  {template.category}
                </p>
                <h3 className="mt-1.5 text-base font-semibold text-slate-900">{template.name}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{template.description}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-10">
        <Link href="/register" className={CTA_SECONDARY}>
          Lihat semua template
        </Link>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Export vs Publish                                                   */
/* ------------------------------------------------------------------ */

export function ExportPublishSection() {
  return (
    <Section id="export-publish" tone="white">
      <SectionHeading
        center
        eyebrow="Dua cara memakai hasilnya"
        title="Download HTML atau terbitkan ke URL publik"
        description="Pilih sesuai kebutuhan: satu file untuk hosting sendiri, atau tautan publik untuk dibagikan cepat."
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900">Download HTML</h3>
            <span className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600">
              Sejak awal
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Ekspor halaman menjadi satu file <span className="font-mono text-[13px]">{"{slug}"}.html</span>{" "}
            yang berisi markup dan CSS inline.
          </p>
          <BulletList
            className="mt-6"
            items={[
              "CSS inline dan aturan @font-face ikut di dalam file, tanpa dependensi build.",
              "File bisa dibuka offline atau diunggah ke hosting pilihan Anda.",
              "Setiap export menyimpan snapshot versi halaman lebih dulu.",
            ]}
          />
          <p className="mt-6 text-xs leading-relaxed text-slate-500">
            Tidak termasuk hosting: file diunggah dan dikelola sendiri.
          </p>
        </div>

        <div className="flex h-full flex-col rounded-xl border border-blue-200 bg-blue-50/40 p-6 shadow-sm ring-1 ring-blue-600/10">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900">Publish</h3>
            <span className="rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white">
              Kemampuan baru
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Terbitkan halaman ke URL publik milik Anda:{" "}
            <span className="font-mono text-[13px]">/pages/nama-halaman</span>.
          </p>
          <BulletList
            className="mt-6"
            items={[
              "Hanya halaman berstatus READY yang bisa diterbitkan; draft tetap 404.",
              "Slug publik unik dan global, terpisah dari slug internal halaman.",
              "Unpublish kapan saja — URL langsung tidak dapat diakses.",
            ]}
          />
          <p className="mt-6 text-xs leading-relaxed text-slate-500">
            Mengganti nama halaman tidak mengubah URL publik sampai Anda publish ulang.
          </p>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Security                                                            */
/* ------------------------------------------------------------------ */

export function SecuritySection() {
  return (
    <Section id="keamanan">
      <SectionHeading
        eyebrow="Keamanan & kepercayaan"
        title="Ruang kerja Anda hanya milik Anda"
        description="Batas kepemilikan data, konflik penyimpanan, dan kunci provider ditangani di server, bukan di browser."
      />

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SECURITY_ITEMS.map((item) => (
          <li key={item.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Use cases                                                           */
/* ------------------------------------------------------------------ */

export function UseCasesSection() {
  return (
    <Section id="use-case" tone="white">
      <SectionHeading
        eyebrow="Cocok untuk"
        title="Halaman yang sering dibutuhkan, tanpa menunggu developer"
        description="Struktur blok yang sama dipakai ulang untuk kebutuhan pemasaran dan profil."
      />

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {USE_CASES.map((useCase) => (
          <li key={useCase.title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">{useCase.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{useCase.description}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ                                                                 */
/* ------------------------------------------------------------------ */

export function FaqSection() {
  return (
    <Section id="faq">
      <div className="mx-auto max-w-3xl">
        <SectionHeading center eyebrow="FAQ" title="Pertanyaan yang sering muncul" />

        <div className="mt-8 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {FAQ_ITEMS.map((item) => (
            <details key={item.question} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-slate-900 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                {item.question}
                <span
                  aria-hidden="true"
                  className="relative flex h-5 w-5 shrink-0 items-center justify-center"
                >
                  <span className="absolute h-0.5 w-3 rounded-full bg-slate-400" />
                  <span className="absolute h-3 w-0.5 rounded-full bg-slate-400 transition-transform group-open:rotate-90 group-open:opacity-0" />
                </span>
              </summary>
              <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Final CTA                                                           */
/* ------------------------------------------------------------------ */

export function FinalCtaSection() {
  return (
    <section className="pb-16 sm:pb-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-2xl bg-linear-to-br from-slate-950 via-slate-900 to-blue-700 px-6 py-12 shadow-xl sm:px-12 sm:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Mulai dari halaman kosong, satu prompt, atau template siap pakai
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
              Buat akun, susun halaman pertama, lalu download HTML atau publish ke URL publik.
              Gratis untuk mulai.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/register" className={CTA_ON_DARK_PRIMARY}>
                Mulai Gratis
              </Link>
              <Link href="/login" className={CTA_ON_DARK_SECONDARY}>
                Masuk
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
