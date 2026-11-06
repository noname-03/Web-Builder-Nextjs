import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { parseDocument } from "../src/features/editor/schemas/document";
import { SEED_TEMPLATES } from "./seed-templates";

const prisma = new PrismaClient();

const LEGACY_TEMPLATE_NAMES = ["Landing Page Sederhana", "Portofolio"];

async function seedAdmin(): Promise<void> {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@example.com").trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", isActive: true },
    create: { email, name: "Administrator", passwordHash, role: "ADMIN" },
  });

  console.log(`Admin siap: ${email}`);
}

async function seedTemplates(): Promise<void> {
  for (const template of SEED_TEMPLATES) {
    const validated = parseDocument(template.content);
    const content = validated as unknown as Prisma.InputJsonValue;
    const existing = await prisma.template.findFirst({ where: { name: template.name } });

    if (existing) {
      await prisma.template.update({
        where: { id: existing.id },
        data: { description: template.description, content },
      });
      continue;
    }

    await prisma.template.create({
      data: { name: template.name, description: template.description, content },
    });
  }

  await prisma.template.updateMany({
    where: { name: { in: LEGACY_TEMPLATE_NAMES } },
    data: { isActive: false },
  });

  console.log(`${SEED_TEMPLATES.length} template siap.`);
}

async function main(): Promise<void> {
  await seedAdmin();
  await seedTemplates();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
