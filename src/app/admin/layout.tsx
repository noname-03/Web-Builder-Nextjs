import Link from "next/link";
import { requireAdminOrNotFound } from "@/server/auth/guards";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireAdminOrNotFound();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
          <Link href="/dashboard" className="text-lg font-semibold text-slate-900">
            Web Builder
          </Link>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            Admin
          </span>
          <nav className="flex items-center gap-4">
            <Link href="/admin/users" className="text-sm text-slate-600 hover:text-slate-900">
              Users
            </Link>
            <Link href="/admin/templates" className="text-sm text-slate-600 hover:text-slate-900">
              Templates
            </Link>
            <Link href="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">
              Dashboard
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
