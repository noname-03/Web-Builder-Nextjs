import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Web Builder - Buat Halaman HTML dengan Drag & Drop",
};

const FEATURES = [
  {
    title: "Drag & Drop",
    description: "Susun blok konten langsung di kanvas. Tidak perlu menulis HTML atau CSS.",
  },
  {
    title: "Export HTML",
    description: "Unduh halaman sebagai satu file HTML siap pakai, lengkap dengan CSS.",
  },
  {
    title: "Riwayat Versi",
    description: "Simpan snapshot dan kembalikan halaman ke versi sebelumnya kapan saja.",
  },
];

const STEPS = [
  { title: "Buat project", description: "Kelompokkan halaman berdasarkan project." },
  { title: "Susun halaman", description: "Tarik blok, atur properti dan style." },
  { title: "Unduh HTML", description: "Export dan gunakan di mana saja." },
];

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4">
      <section className="flex flex-col items-start gap-6 py-14 sm:py-20">
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
          Tanpa coding
        </span>
        <h1 className="max-w-3xl text-3xl font-bold leading-tight text-slate-900 sm:text-5xl">
          Bangun halaman web dengan drag &amp; drop, lalu export sebagai HTML
        </h1>
        <p className="max-w-2xl text-base text-slate-600 sm:text-lg">
          Web Builder membantu Anda menyusun halaman statis dengan cepat. Semua project tersimpan
          di database, hasil akhirnya bisa diunduh sebagai file HTML.
        </p>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/register"
            className="rounded-md bg-blue-600 px-5 py-3 text-center text-sm font-medium text-white hover:bg-blue-700"
          >
            Mulai Gratis
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-slate-300 bg-white px-5 py-3 text-center text-sm font-medium text-slate-800 hover:bg-slate-100"
          >
            Masuk
          </Link>
        </div>
      </section>

      <section id="fitur" className="py-10">
        <h2 className="text-2xl font-semibold text-slate-900">Fitur utama</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-lg border border-slate-200 bg-white p-5">
              <h3 className="text-base font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="cara-kerja" className="py-10 pb-16">
        <h2 className="text-2xl font-semibold text-slate-900">Cara kerja</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-lg border border-slate-200 bg-white p-5">
              <span className="text-sm font-semibold text-blue-600">Langkah {index + 1}</span>
              <h3 className="mt-1 text-base font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
