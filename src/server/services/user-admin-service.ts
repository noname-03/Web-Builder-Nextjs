import "server-only";
import type { Role } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { db } from "@/server/db";
import {
  countActiveAdmins,
  findUserById,
  listUsers,
  updateUserActive,
  updateUserRole,
} from "@/server/repositories/user-repository";

const PAGE_SIZE = 20;

export async function listUsersForAdmin(input: { query: string; page: number }) {
  const page = Number.isFinite(input.page) && input.page > 0 ? Math.floor(input.page) : 1;
  const result = await listUsers({ query: input.query.trim(), page, pageSize: PAGE_SIZE });
  return { ...result, page, pageSize: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(result.total / PAGE_SIZE)) };
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
    await db.$transaction(async () => {
      const remainingAdmins = await countActiveAdmins(input.userId);
      if (remainingAdmins === 0) {
        throw new AppError("CONFLICT", "Minimal harus ada satu admin aktif.");
      }
      await updateUserRole(input.userId, input.role);
    });
    return;
  }

  await updateUserRole(input.userId, input.role);
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

  if (!input.isActive && user.role === "ADMIN") {
    await db.$transaction(async () => {
      const remainingAdmins = await countActiveAdmins(input.userId);
      if (remainingAdmins === 0) {
        throw new AppError("CONFLICT", "Minimal harus ada satu admin aktif.");
      }
      await updateUserActive(input.userId, input.isActive);
    });
    return;
  }

  await updateUserActive(input.userId, input.isActive);
}
