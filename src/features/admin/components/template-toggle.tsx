"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleTemplateAction } from "@/features/admin/actions";

export function TemplateToggle({
  templateId,
  isActive,
}: {
  templateId: string;
  isActive: boolean;
}) {
  const [pending, setPending] = useState(false);

  async function handleToggle() {
    setPending(true);
    const result = await toggleTemplateAction({ templateId, isActive: !isActive });
    setPending(false);
    if (result.ok) {
      toast.success(isActive ? "Template dinonaktifkan." : "Template diaktifkan.");
      return;
    }
    toast.error(result.error.message);
  }

  return (
    <Button size="sm" variant="ghost" loading={pending} onClick={handleToggle}>
      {isActive ? "Nonaktifkan" : "Aktifkan"}
    </Button>
  );
}
