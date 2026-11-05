import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorShell } from "@/features/editor/components/editor-shell";
import { isAppError } from "@/lib/errors";
import { requireUserOrRedirect } from "@/server/auth/guards";
import { getPageForEditor } from "@/server/services/page-service";

export const metadata: Metadata = { title: "Editor" };

export default async function EditorPage({ params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await params;
  const user = await requireUserOrRedirect(`/editor/${pageId}`);

  let page;
  try {
    page = await getPageForEditor({ pageId, userId: user.id });
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") notFound();
    throw error;
  }

  return (
    <EditorShell
      initial={{
        pageId: page.id,
        projectId: page.projectId,
        projectName: page.projectName,
        slug: page.slug,
        title: page.title,
        document: page.document,
        revision: page.revision,
        documentIsValid: page.documentIsValid,
      }}
    />
  );
}
