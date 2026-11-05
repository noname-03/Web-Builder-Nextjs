import "server-only";
import { AppError } from "@/lib/errors";
import { isUniqueConstraintError } from "@/server/prisma-errors";
import {
  createProjectRecord,
  findOwnedProject,
  listProjectsByUser,
  renameProjectRecord,
  softDeleteProject,
} from "@/server/repositories/project-repository";

const PAGE_SIZE = 24;

export async function listProjects(userId: string) {
  return listProjectsByUser({ userId, page: 1, pageSize: PAGE_SIZE });
}

export async function getOwnedProject(input: { projectId: string; userId: string }) {
  const project = await findOwnedProject(input);
  if (!project) throw new AppError("NOT_FOUND", "Project tidak ditemukan.");
  return project;
}

export async function createProject(input: { userId: string; name: string; description?: string }) {
  const name = input.name.trim();
  const description = input.description?.trim() || null;

  try {
    return await createProjectRecord({ userId: input.userId, name, description });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError("CONFLICT", "Nama project sudah dipakai.", {
        name: ["Nama project sudah dipakai."],
      });
    }
    throw error;
  }
}

export async function renameProject(input: {
  userId: string;
  projectId: string;
  name: string;
}): Promise<void> {
  const name = input.name.trim();
  try {
    const count = await renameProjectRecord({ userId: input.userId, projectId: input.projectId, name });
    if (count === 0) throw new AppError("NOT_FOUND", "Project tidak ditemukan.");
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError("CONFLICT", "Nama project sudah dipakai.", {
        name: ["Nama project sudah dipakai."],
      });
    }
    throw error;
  }
}

export async function deleteProject(input: { userId: string; projectId: string }): Promise<void> {
  const count = await softDeleteProject(input);
  if (count === 0) throw new AppError("NOT_FOUND", "Project tidak ditemukan.");
}
