import "server-only";
import { Prisma } from "@prisma/client";

export function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export function isRecordNotFoundError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}

export function handlePrismaError(error: unknown): never {
  if (isUniqueConstraintError(error)) {
    throw new Error("UNIQUE_CONSTRAINT");
  }
  throw error;
}
