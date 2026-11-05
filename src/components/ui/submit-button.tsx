"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function SubmitButton({
  children,
  pendingText,
  className,
  variant,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" loading={pending} className={className} variant={variant}>
      {pending ? pendingText ?? "Memproses..." : children}
    </Button>
  );
}
