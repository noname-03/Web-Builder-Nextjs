import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/empty-state";
import { CreateProjectDialog } from "@/features/projects/components/create-project-dialog";
import { ProjectCard } from "@/features/projects/components/project-card";
import { requireUserOrRedirect } from "@/server/auth/guards";
import { listProjects } from "@/server/services/project-service";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUserOrRedirect("/dashboard");
  const { items } = await listProjects(user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Project</h1>
          <p className="mt-1 text-sm text-slate-600">Kelola project dan halaman Anda.</p>
        </div>
        <CreateProjectDialog />
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Belum ada project"
          description="Gunakan tombol Project Baru di atas untuk membuat project pertama Anda."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((project) => (
            <ProjectCard
              key={project.id}
              project={{
                id: project.id,
                name: project.name,
                description: project.description,
                pageCount: project._count.pages,
                updatedAt: project.updatedAt.toISOString(),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
