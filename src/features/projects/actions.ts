"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/result";
import { invalid, toActionError } from "@/server/action-error";
import { requireUser } from "@/server/auth/guards";
import { createProject, deleteProject, renameProject } from "@/server/services/project-service";
import { projectIdSchema, projectSchema } from "@/features/projects/schemas";

const renameSchema = projectSchema.pick({ name: true }).extend({ projectId: projectIdSchema });

export async function createProjectAction(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const parsed = projectSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return invalid(parsed.error);

    const project = await createProject({
      userId: user.id,
      name: parsed.data.name,
      description: parsed.data.description,
    });

    revalidatePath("/dashboard");
    return { ok: true, data: { id: project.id } };
  } catch (error) {
    return toActionError(error, "createProjectAction");
  }
}

export async function renameProjectAction(input: {
  projectId: string;
  name: string;
}): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const parsed = renameSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    await renameProject({ userId: user.id, projectId: parsed.data.projectId, name: parsed.data.name });
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/projects/${parsed.data.projectId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error, "renameProjectAction");
  }
}

export async function deleteProjectAction(projectId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const parsed = projectIdSchema.safeParse(projectId);
    if (!parsed.success) return invalid(parsed.error);

    await deleteProject({ userId: user.id, projectId: parsed.data });
    revalidatePath("/dashboard");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error, "deleteProjectAction");
  }
}
