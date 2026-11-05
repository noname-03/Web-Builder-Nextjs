import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/card";
import { UserRowActions } from "@/features/admin/components/user-row-actions";
import { requireAdmin } from "@/server/auth/guards";
import { listUsersForAdmin } from "@/server/services/user-admin-service";

export const metadata: Metadata = { title: "Kelola User" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const query = params.q ?? "";
  const page = Number(params.page ?? "1") || 1;
  const result = await listUsersForAdmin({ query, page });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Kelola User</h1>
        <p className="mt-1 text-sm text-slate-600">Total {result.total} user terdaftar.</p>
      </div>

      <form method="get" className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Cari email atau nama"
          className="w-full max-w-sm rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Cari
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {result.items.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{user.name}</td>
                <td className="px-4 py-3 text-slate-600">{user.email}</td>
                <td className="px-4 py-3">
                  <Badge tone={user.role === "ADMIN" ? "warning" : "neutral"}>{user.role}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={user.isActive ? "success" : "danger"}>
                    {user.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-slate-600">{user._count.projects}</td>
                <td className="px-4 py-3">
                  <UserRowActions
                    userId={user.id}
                    role={user.role}
                    isActive={user.isActive}
                    disabled={user.id === admin.id}
                  />
                </td>
              </tr>
            ))}
            {result.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Tidak ada user yang cocok.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>
          Halaman {result.page} dari {result.totalPages}
        </span>
        <div className="flex gap-2">
          {result.page > 1 ? (
            <Link
              href={`/admin/users?q=${encodeURIComponent(query)}&page=${result.page - 1}`}
              className="rounded-md border border-slate-300 px-3 py-1 hover:bg-slate-100"
            >
              Sebelumnya
            </Link>
          ) : null}
          {result.page < result.totalPages ? (
            <Link
              href={`/admin/users?q=${encodeURIComponent(query)}&page=${result.page + 1}`}
              className="rounded-md border border-slate-300 px-3 py-1 hover:bg-slate-100"
            >
              Berikutnya
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
