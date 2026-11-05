import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/login-form";
import { safeCallbackUrl } from "@/server/action-error";

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Masuk</h1>
        <p className="mt-1 text-sm text-slate-600">Gunakan akun yang sudah terdaftar.</p>
      </div>
      <LoginForm callbackUrl={safeCallbackUrl(params.callbackUrl)} />
    </div>
  );
}
