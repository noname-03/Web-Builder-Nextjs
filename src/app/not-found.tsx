import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold text-slate-900">Halaman tidak ditemukan</h1>
      <p className="max-w-md text-sm text-slate-600">
        Data yang Anda cari tidak tersedia atau bukan milik akun Anda.
      </p>
      <Link
        href="/dashboard"
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Ke Dashboard
      </Link>
    </div>
  );
}
