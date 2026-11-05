import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().trim().min(1, "Nama project wajib diisi.").max(100, "Nama maksimal 100 karakter."),
  description: z.string().trim().max(500, "Deskripsi maksimal 500 karakter.").optional().default(""),
});

export const projectIdSchema = z.string().uuid("ID project tidak valid.");
