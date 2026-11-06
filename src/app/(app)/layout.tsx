import Link from "next/link";
import { logoutAction } from "@/features/auth/actions";
import { requireUserOrRedirect } from "@/server/auth/guards";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUserOrRedirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-lg font-semibold text-slate-900">
              Web Builder
            </Link>
            <Link href="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">
              Dashboard
            </Link>
            <Link href="/settings/ai" className="text-sm text-slate-600 hover:text-slate-900">
              AI
            </Link>
            {user.role === "ADMIN" ? (
              <Link href="/admin/users" className="text-sm text-slate-600 hover:text-slate-900">
                Admin
              </Link>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">{user.name}</span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                Keluar
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
