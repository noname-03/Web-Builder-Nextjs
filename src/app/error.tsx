"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold text-slate-900">Terjadi kesalahan</h1>
      <p className="max-w-md text-sm text-slate-600">
        Permintaan Anda tidak dapat diproses. Coba lagi, atau kembali ke dashboard.
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
