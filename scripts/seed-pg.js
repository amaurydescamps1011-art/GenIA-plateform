require("dotenv").config();
const { PrismaNeon } = require("@prisma/adapter-neon");
const { PrismaClient } = require("../node_modules/.prisma/client");
const bcrypt = require("bcryptjs");

async function main() {
  const adapter = new PrismaNeon({ connectionString: process.env.POSTGRES_PRISMA_URL });
  const prisma = new PrismaClient({ adapter });

  const users = [
    { name: "Amaury", email: "amaury@genia.internal", password: "123", role: "admin" },
    { name: "Fabien", email: "fabien@genia.internal", password: "fabien", role: "user" },
  ];

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 12);
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, password: hash, role: u.role },
      create: { name: u.name, email: u.email, password: hash, role: u.role },
    });
    console.log("Utilisateur:", created.name);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
