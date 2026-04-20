import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("genia2024", 12);
  const user = await prisma.user.upsert({
    where: { email: "amaury@genia.studio" },
    update: {},
    create: {
      name: "Amaury",
      email: "amaury@genia.studio",
      password,
      role: "admin",
    },
  });
  console.log("Admin créé :", user.email);
}

main().finally(() => prisma.$disconnect());
