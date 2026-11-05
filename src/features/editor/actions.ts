"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/result";
import { invalid, toActionError } from "@/server/action-error";
import { requireUser } from "@/server/auth/guards";
import {
  createPageFromContent,
  forceSavePageContent,
  getPageDocument,
} from "@/server/services/page-service";
import { createSnapshot, getPageVersions, restoreVersion } from "@/server/services/version-service";
import { pageIdSchema, versionIdSchema } from "@/features/pages/schemas";

const createSnapshotSchema = z.object({ pageId: pageIdSchema });
const restoreVersionSchema = z.object({ pageId: pageIdSchema, versionId: versionIdSchema });
const forceSaveSchema = z.object({ pageId: pageIdSchema, content: z.unknown() });
const createFromContentSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().trim().min(1).max(150),
  content: z.unknown(),
});

export async function loadPageDocumentAction(
  pageId: string,
): Promise<ActionResult<{ document: unknown; revision: number }>> {
  try {
    const user = await requireUser();
    const parsed = pageIdSchema.safeParse(pageId);
    if (!parsed.success) return invalid(parsed.error);

    const result = await getPageDocument({ userId: user.id, pageId: parsed.data });
    return { ok: true, data: { document: result.document, revision: result.revision } };
  } catch (error) {
    return toActionError(error, "loadPageDocumentAction");
  }
}

export async function forceSavePageContentAction(input: {
  pageId: string;
  content: unknown;
}): Promise<ActionResult<{ revision: number }>> {
  try {
    const user = await requireUser();
    const parsed = forceSaveSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const result = await forceSavePageContent({
      userId: user.id,
      pageId: parsed.data.pageId,
      content: parsed.data.content,
    });

    return { ok: true, data: { revision: result.revision } };
  } catch (error) {
    return toActionError(error, "forceSavePageContentAction");
  }
}

export async function createPageFromContentAction(input: {
  projectId: string;
  title: string;
  content: unknown;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const parsed = createFromContentSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const page = await createPageFromContent({
      userId: user.id,
      projectId: parsed.data.projectId,
      title: parsed.data.title,
      content: parsed.data.content,
    });

    revalidatePath(`/dashboard/projects/${parsed.data.projectId}`);
    return { ok: true, data: { id: page.id } };
  } catch (error) {
    return toActionError(error, "createPageFromContentAction");
  }
}

export async function createManualSnapshotAction(pageId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const parsed = createSnapshotSchema.safeParse({ pageId });
    if (!parsed.success) return invalid(parsed.error);

    await createSnapshot({ userId: user.id, pageId: parsed.data.pageId, source: "MANUAL" });
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error, "createManualSnapshotAction");
  }
}

export type VersionItemData = {
  id: string;
  revision: number;
  source: string;
  createdAt: string;
};

export async function loadVersionsAction(
  pageId: string,
): Promise<ActionResult<VersionItemData[]>> {
  try {
    const user = await requireUser();
    const parsed = pageIdSchema.safeParse(pageId);
    if (!parsed.success) return invalid(parsed.error);

    const versions = await getPageVersions({ pageId: parsed.data, userId: user.id });
    return {
      ok: true,
      data: versions.map((version) => ({
        id: version.id,
        revision: version.revision,
        source: version.source,
        createdAt: version.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    return toActionError<VersionItemData[]>(error, "loadVersionsAction");
  }
}

export async function restoreVersionAction(input: {
  pageId: string;
  versionId: string;
}): Promise<ActionResult<{ revision: number; document: unknown }>> {
  try {
    const user = await requireUser();
    const parsed = restoreVersionSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const result = await restoreVersion({
      userId: user.id,
      pageId: parsed.data.pageId,
      versionId: parsed.data.versionId,
    });

    return { ok: true, data: { revision: result.revision, document: result.document } };
  } catch (error) {
    return toActionError(error, "restoreVersionAction");
  }
}
