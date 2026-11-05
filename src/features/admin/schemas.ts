import { z } from "zod";

export const changeUserRoleSchema = z.object({
  userId: z.string().uuid("ID user tidak valid."),
  role: z.enum(["USER", "ADMIN"]),
});

export const setUserActiveSchema = z.object({
  userId: z.string().uuid("ID user tidak valid."),
  isActive: z.boolean(),
});

export const templateSchema = z.object({
  templateId: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Nama template wajib diisi.").max(100),
  description: z.string().trim().max(300).optional().default(""),
  content: z.string().min(2, "Konten template wajib diisi."),
});

export const templateToggleSchema = z.object({
  templateId: z.string().uuid("ID template tidak valid."),
  isActive: z.boolean(),
});
