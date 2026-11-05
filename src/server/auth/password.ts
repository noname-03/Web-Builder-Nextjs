import "server-only";
import bcrypt from "bcryptjs";

const BCRYPT_COST = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO1U3n0a2g7f9yGx5u4oQ2zJcKXWkQ0S2";

export async function verifyDummyPassword(password: string): Promise<void> {
  await bcrypt.compare(password, DUMMY_HASH);
}
