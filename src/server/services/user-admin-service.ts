import "server-only";
import type { Role } from "@prisma/client";
import { AppError } from "@/lib/errors";
import {
  findUserById,
  listUsers,
  updateUserActiveGuarded,
  updateUserRoleGuarded,
} from "@/server/repositories/user-repository";

const PAGE_SIZE = 20;

export async function listUsersForAdmin(input: { query: string; page: number }) {
  const page = Number.isFinite(input.page) && input.page > 0 ? Math.floor(input.page) : 1;
  const result = await listUsers({ query: input.query.trim(), page, pageSize: PAGE_SIZE });
  return {
    ...result,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(result.total / PAGE_SIZE)),
  };
}

export async function changeUserRole(input: {
  adminId: string;
  userId: string;
  role: Role;
}): Promise<void> {
  if (input.adminId === input.userId) {
    throw new AppError("FORBIDDEN", "Anda tidak dapat mengubah role sendiri.");
  }

  const user = await findUserById(input.userId);
  if (!user) throw new AppError("NOT_FOUND", "User tidak ditemukan.");

  if (user.role === "ADMIN" && input.role !== "ADMIN") {
    const result = await updateUserRoleGuarded({ userId: input.userId, role: input.role });
    if (result === "last-admin") {
      throw new AppError("CONFLICT", "Minimal harus ada satu admin aktif.");
    }
    return;
  }

  await updateUserRoleGuarded({ userId: input.userId, role: input.role });
}

export async function setUserActive(input: {
  adminId: string;
  userId: string;
  isActive: boolean;
}): Promise<void> {
  if (input.adminId === input.userId) {
    throw new AppError("FORBIDDEN", "Anda tidak dapat menonaktifkan akun sendiri.");
  }

  const user = await findUserById(input.userId);
  if (!user) throw new AppError("NOT_FOUND", "User tidak ditemukan.");

  const result = await updateUserActiveGuarded({
    userId: input.userId,
    isActive: input.isActive,
    requireRemainingAdmin: !input.isActive && user.role === "ADMIN",
  });

  if (result === "last-admin") {
    throw new AppError("CONFLICT", "Minimal harus ada satu admin aktif.");
  }
}
