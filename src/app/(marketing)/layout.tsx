import { SiteHeader } from "@/components/layout/site-header";
import { getOptionalUser } from "@/server/auth/guards";

export default async function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getOptionalUser();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader isAuthenticated={Boolean(user)} />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 text-sm text-slate-500">
          © 2026 Web Builder. Buat halaman, export HTML, tanpa coding.
        </div>
      </footer>
    </div>
  );
}
