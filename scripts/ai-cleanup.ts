import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const retentionDays = Number(process.env.AI_RETENTION_DAYS ?? "90");
  const batchSize = Number(process.env.AI_CLEANUP_BATCH ?? "500");
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const rows = await prisma.aiGeneration.findMany({
    where: { createdAt: { lt: cutoff } },
    take: batchSize,
    select: { id: true },
  });

  if (rows.length === 0) {
    console.log("Tidak ada riwayat AI yang perlu dihapus.");
    return;
  }

  const result = await prisma.aiGeneration.deleteMany({
    where: { id: { in: rows.map((row) => row.id) } },
  });

  console.log(`Dihapus ${result.count} riwayat AI lebih tua dari ${retentionDays} hari.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
