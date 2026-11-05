"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function EditorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100 px-4 text-center">
      <h1 className="text-xl font-semibold text-slate-900">Editor gagal dimuat</h1>
      <p className="max-w-md text-sm text-slate-600">
        {error.message || "Terjadi kesalahan saat memuat editor."}
      </p>
      <div className="flex gap-2">
        <Button onClick={reset}>Coba lagi</Button>
        <Button variant="secondary" onClick={() => router.push("/dashboard")}>
          Ke Dashboard
        </Button>
      </div>
    </div>
  );
}
