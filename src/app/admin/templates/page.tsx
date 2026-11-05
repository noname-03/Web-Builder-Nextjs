import type { Metadata } from "next";
import { Badge } from "@/components/ui/card";
import { TemplateDialog } from "@/features/admin/components/template-dialog";
import { TemplateToggle } from "@/features/admin/components/template-toggle";
import { createEmptyDocument } from "@/features/editor/schemas/document";
import { requireAdmin } from "@/server/auth/guards";
import { getAllTemplates } from "@/server/services/template-service";

export const metadata: Metadata = { title: "Kelola Template" };

export default async function AdminTemplatesPage() {
  await requireAdmin();
  const templates = await getAllTemplates();
  const starterJson = JSON.stringify(createEmptyDocument("Template Baru"), null, 2);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Kelola Template</h1>
          <p className="mt-1 text-sm text-slate-600">
            Template aktif tampil saat user membuat halaman baru.
          </p>
        </div>
        <TemplateDialog triggerLabel="Template Baru" />
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Deskripsi</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {templates.map((template) => (
              <tr key={template.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{template.name}</td>
                <td className="px-4 py-3 text-slate-600">{template.description || "-"}</td>
                <td className="px-4 py-3">
                  <Badge tone={template.isActive ? "success" : "neutral"}>
                    {template.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <TemplateDialog
                      triggerLabel="Edit"
                      template={{
                        id: template.id,
                        name: template.name,
                        description: template.description,
                        contentJson: JSON.stringify(template.content, null, 2),
                      }}
                    />
                    <TemplateToggle templateId={template.id} isActive={template.isActive} />
                  </div>
                </td>
              </tr>
            ))}
            {templates.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  Belum ada template. Gunakan JSON berikut untuk membuat yang pertama.
                  <pre className="mt-3 max-h-40 overflow-auto rounded bg-slate-50 p-3 text-left text-xs">
                    {starterJson}
                  </pre>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
