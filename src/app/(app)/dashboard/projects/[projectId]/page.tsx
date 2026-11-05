import Link from "next/link";
import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/empty-state";
import { CreatePageDialog } from "@/features/pages/components/create-page-dialog";
import { PageCard } from "@/features/pages/components/page-card";
import { requireUserOrRedirect } from "@/server/auth/guards";
import { listPages } from "@/server/services/page-service";
import { getOwnedProject } from "@/server/services/project-service";
import { getActiveTemplates } from "@/server/services/template-service";

export const metadata: Metadata = { title: "Halaman Project" };

export default async function ProjectPagesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await requireUserOrRedirect(`/dashboard/projects/${projectId}`);
  const project = await getOwnedProject({ projectId, userId: user.id });
  const [pages, templates] = await Promise.all([
    listPages({ projectId, userId: user.id }),
    getActiveTemplates(),
  ]);

  return (
    <div className="space-y-6">
      <nav className="text-sm text-slate-500">
        <Link href="/dashboard" className="hover:text-slate-900">
          Dashboard
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">{project.name}</span>
      </nav>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{project.name}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {project.description || "Kelola halaman di project ini."}
          </p>
        </div>
        <CreatePageDialog projectId={project.id} templates={templates} />
      </div>

      {pages.length === 0 ? (
        <EmptyState
          title="Belum ada halaman"
          description="Buat halaman baru dari template atau mulai dari halaman kosong."
          action={<CreatePageDialog projectId={project.id} templates={templates} />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <PageCard
              key={page.id}
              page={{
                id: page.id,
                title: page.title,
                slug: page.slug,
                status: page.status,
                updatedAt: page.updatedAt.toISOString(),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
