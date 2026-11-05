import Link from "next/link";
import { redirect } from "next/navigation";
import { getOptionalUser } from "@/server/auth/guards";

export default async function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getOptionalUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-10">
      <Link href="/" className="text-xl font-semibold text-slate-900">
        Web Builder
      </Link>
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        {children}
      </div>
    </div>
  );
}
