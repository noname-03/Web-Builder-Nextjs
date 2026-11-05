"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/result";
import { invalid, toActionError } from "@/server/action-error";
import { requireUser } from "@/server/auth/guards";
import {
  createPage,
  deletePage,
  duplicatePage,
  renamePage,
  savePageContent,
} from "@/server/services/page-service";
import {
  createPageSchema,
  pageIdSchema,
  renamePageSchema,
  savePageContentSchema,
} from "@/features/pages/schemas";

export async function createPageAction(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const parsed = createPageSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return invalid(parsed.error);

    const page = await createPage({
      userId: user.id,
      projectId: parsed.data.projectId,
      title: parsed.data.title,
      templateId: parsed.data.templateId || null,
    });

    revalidatePath(`/dashboard/projects/${parsed.data.projectId}`);
    return { ok: true, data: { id: page.id } };
  } catch (error) {
    return toActionError(error, "createPageAction");
  }
}

export async function renamePageAction(input: {
  pageId: string;
  title: string;
}): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const parsed = renamePageSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    await renamePage({ userId: user.id, pageId: parsed.data.pageId, title: parsed.data.title });
    revalidatePath(`/dashboard/projects`);
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error, "renamePageAction");
  }
}

export async function deletePageAction(pageId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const parsed = pageIdSchema.safeParse(pageId);
    if (!parsed.success) return invalid(parsed.error);

    await deletePage({ userId: user.id, pageId: parsed.data });
    revalidatePath("/dashboard/projects");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error, "deletePageAction");
  }
}

export async function duplicatePageAction(pageId: string): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const parsed = pageIdSchema.safeParse(pageId);
    if (!parsed.success) return invalid(parsed.error);

    const page = await duplicatePage({ userId: user.id, pageId: parsed.data });
    revalidatePath("/dashboard/projects");
    return { ok: true, data: { id: page.id } };
  } catch (error) {
    return toActionError(error, "duplicatePageAction");
  }
}

export async function savePageContentAction(input: {
  pageId: string;
  content: unknown;
  baseRevision: number;
}): Promise<ActionResult<{ revision: number }>> {
  try {
    const user = await requireUser();
    const parsed = savePageContentSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const result = await savePageContent({
      userId: user.id,
      pageId: parsed.data.pageId,
      content: parsed.data.content,
      baseRevision: parsed.data.baseRevision,
    });

    return { ok: true, data: { revision: result.revision } };
  } catch (error) {
    return toActionError(error, "savePageContentAction");
  }
}
