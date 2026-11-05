import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isAppError } from "@/lib/errors";
import { renderHtml } from "@/features/export/render-html";
import { requireUserOrRedirect } from "@/server/auth/guards";
import { getPageForEditor } from "@/server/services/page-service";

export const metadata: Metadata = { title: "Preview" };

export default async function PreviewPage({ params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await params;
  const user = await requireUserOrRedirect(`/editor/${pageId}/preview`);

  let page;
  try {
    page = await getPageForEditor({ pageId, userId: user.id });
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") notFound();
    throw error;
  }

  const html = renderHtml(page.document);

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2">
        <span className="text-sm font-semibold text-slate-900">Preview: {page.title}</span>
        <Link
          href={`/editor/${pageId}`}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
        >
          Kembali ke editor
        </Link>
      </header>
      <iframe
        title={`Preview ${page.title}`}
        sandbox=""
        srcDoc={html}
        className="flex-1 border-0 bg-white"
      />
    </div>
  );
}
