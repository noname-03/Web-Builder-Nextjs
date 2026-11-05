import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email wajib diisi.").max(255).email("Format email tidak valid."),
  password: z.string().min(1, "Password wajib diisi.").max(72),
  callbackUrl: z.string().optional(),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(100, "Nama maksimal 100 karakter."),
    email: z.string().trim().toLowerCase().min(1, "Email wajib diisi.").max(255).email("Format email tidak valid."),
    password: z
      .string()
      .min(8, "Password minimal 8 karakter.")
      .max(72, "Password maksimal 72 karakter.")
      .regex(/[A-Za-z]/, "Password harus mengandung huruf.")
      .regex(/[0-9]/, "Password harus mengandung angka."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi password tidak sama.",
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
