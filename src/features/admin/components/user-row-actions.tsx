"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { changeUserRoleAction, setUserActiveAction } from "@/features/admin/actions";

export function UserRowActions({
  userId,
  role,
  isActive,
  disabled,
}: {
  userId: string;
  role: "USER" | "ADMIN";
  isActive: boolean;
  disabled: boolean;
}) {
  const [pending, setPending] = useState(false);

  async function handleRoleChange(nextRole: "USER" | "ADMIN") {
    setPending(true);
    const result = await changeUserRoleAction({ userId, role: nextRole });
    setPending(false);
    if (result.ok) {
      toast.success("Role diperbarui.");
      return;
    }
    toast.error(result.error.message);
  }

  async function handleToggleActive() {
    setPending(true);
    const result = await setUserActiveAction({ userId, isActive: !isActive });
    setPending(false);
    if (result.ok) {
      toast.success(isActive ? "User dinonaktifkan." : "User diaktifkan.");
      return;
    }
    toast.error(result.error.message);
  }

  if (disabled) {
    return <span className="text-xs text-slate-400">Akun Anda</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={role}
        disabled={pending}
        onChange={(event) => void handleRoleChange(event.target.value as "USER" | "ADMIN")}
        aria-label="Ubah role"
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
      >
        <option value="USER">USER</option>
        <option value="ADMIN">ADMIN</option>
      </select>
      <Button size="sm" variant={isActive ? "ghost" : "secondary"} loading={pending} onClick={handleToggleActive}>
        {isActive ? "Nonaktifkan" : "Aktifkan"}
      </Button>
    </div>
  );
}
