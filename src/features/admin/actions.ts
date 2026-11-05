"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import type { ActionResult } from "@/lib/result";
import { invalid, toActionError } from "@/server/action-error";
import { requireAdmin } from "@/server/auth/guards";
import { changeUserRole, setUserActive } from "@/server/services/user-admin-service";
import { createTemplate, toggleTemplate, updateTemplate } from "@/server/services/template-service";
import {
  changeUserRoleSchema,
  setUserActiveSchema,
  templateSchema,
  templateToggleSchema,
} from "@/features/admin/schemas";

export async function changeUserRoleAction(input: {
  userId: string;
  role: Role;
}): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = changeUserRoleSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    await changeUserRole({ adminId: admin.id, userId: parsed.data.userId, role: parsed.data.role });
    revalidatePath("/admin/users");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error, "changeUserRoleAction");
  }
}

export async function setUserActiveAction(input: {
  userId: string;
  isActive: boolean;
}): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = setUserActiveSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    await setUserActive({
      adminId: admin.id,
      userId: parsed.data.userId,
      isActive: parsed.data.isActive,
    });
    revalidatePath("/admin/users");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error, "setUserActiveAction");
  }
}

export async function saveTemplateAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = templateSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return invalid(parsed.error);

    let content: unknown;
    try {
      content = JSON.parse(parsed.data.content);
    } catch {
      return {
        ok: false,
        error: {
          code: "VALIDATION",
          message: "Konten template tidak valid.",
          fieldErrors: { content: ["JSON tidak valid."] },
        },
      };
    }

    if (parsed.data.templateId) {
      await updateTemplate({
        templateId: parsed.data.templateId,
        name: parsed.data.name,
        description: parsed.data.description,
        content,
      });
    } else {
      await createTemplate({
        adminId: admin.id,
        name: parsed.data.name,
        description: parsed.data.description,
        content,
      });
    }

    revalidatePath("/admin/templates");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error, "saveTemplateAction");
  }
}

export async function toggleTemplateAction(input: {
  templateId: string;
  isActive: boolean;
}): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = templateToggleSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    await toggleTemplate(parsed.data);
    revalidatePath("/admin/templates");
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error, "toggleTemplateAction");
  }
}
