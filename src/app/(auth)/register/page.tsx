import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = { title: "Daftar" };

export default function RegisterPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Daftar</h1>
        <p className="mt-1 text-sm text-slate-600">Buat akun untuk mulai menyusun halaman.</p>
      </div>
      <RegisterForm />
    </div>
  );
}
