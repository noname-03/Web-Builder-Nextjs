"use server";

import type { ActionResult } from "@/lib/result";
import { invalid, toActionError } from "@/server/action-error";
import { requireUser } from "@/server/auth/guards";
import { createSnapshot, restoreVersion } from "@/server/services/version-service";
import { pageIdSchema, versionIdSchema } from "@/features/pages/schemas";
import { z } from "zod";

const createSnapshotSchema = z.object({ pageId: pageIdSchema });
const restoreVersionSchema = z.object({ pageId: pageIdSchema, versionId: versionIdSchema });

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
