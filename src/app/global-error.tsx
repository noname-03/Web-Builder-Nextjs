"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Aplikasi gagal dimuat</h1>
          <p className="mt-2 text-sm text-slate-600">{error.message || "Terjadi kesalahan sistem."}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white"
          >
            Muat ulang
          </button>
        </div>
      </body>
    </html>
  );
}
