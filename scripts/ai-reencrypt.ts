import { PrismaClient } from "@prisma/client";
import { decryptWithKey, encryptWithKey } from "../src/server/crypto/aes";

const prisma = new PrismaClient();

function readKey(name: string): Buffer {
  const raw = process.env[name];
  if (!raw) throw new Error(`Environment ${name} wajib diisi.`);
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error(`${name} harus base64 dari 32 byte.`);
  return key;
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  const oldKey = readKey("AI_REENCRYPT_OLD_KEY");
  const newKey = readKey("AI_REENCRYPT_NEW_KEY");
  const version = process.env.ENCRYPTION_KEY_VERSION ?? "v1";

  const providers = await prisma.aiProvider.findMany({
    select: { id: true, apiKeyEncrypted: true },
  });

  let updated = 0;
  let failed = 0;

  for (const provider of providers) {
    try {
      const plaintext = decryptWithKey(provider.apiKeyEncrypted, oldKey);
      const reencrypted = encryptWithKey(plaintext, newKey, version);

      if (!dryRun) {
        await prisma.aiProvider.update({
          where: { id: provider.id },
          data: { apiKeyEncrypted: reencrypted },
        });
      }
      updated += 1;
    } catch {
      failed += 1;
    }
  }

  console.log(
    `${dryRun ? "[dry-run] " : ""}Re-enkripsi selesai: ${updated} berhasil, ${failed} gagal.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
