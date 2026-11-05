"use client";

import Link from "next/link";
import { useState } from "react";

export function SiteHeader({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-slate-900">
          Web Builder
        </Link>

        <button
          type="button"
          aria-label="Buka menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:hidden"
        >
          Menu
        </button>

        <nav className="hidden items-center gap-4 sm:flex">
          <Link href="/#fitur" className="text-sm text-slate-600 hover:text-slate-900">
            Fitur
          </Link>
          <Link href="/#cara-kerja" className="text-sm text-slate-600 hover:text-slate-900">
            Cara Kerja
          </Link>
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Buka Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-slate-700 hover:text-slate-900">
                Masuk
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Mulai Gratis
              </Link>
            </>
          )}
        </nav>
      </div>

      {open ? (
        <nav className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:hidden">
          <Link href="/#fitur" className="text-sm text-slate-700" onClick={() => setOpen(false)}>
            Fitur
          </Link>
          <Link href="/#cara-kerja" className="text-sm text-slate-700" onClick={() => setOpen(false)}>
            Cara Kerja
          </Link>
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white"
            >
              Buka Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-slate-700">
                Masuk
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white"
              >
                Mulai Gratis
              </Link>
            </>
          )}
        </nav>
      ) : null}
    </header>
  );
}
