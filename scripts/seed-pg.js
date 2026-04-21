require("dotenv").config();
const { PrismaNeon } = require("@prisma/adapter-neon");
const { PrismaClient } = require("../node_modules/.prisma/client");
const bcrypt = require("bcryptjs");

async function main() {
  const adapter = new PrismaNeon({ connectionString: process.env.POSTGRES_PRISMA_URL });
  const prisma = new PrismaClient({ adapter });
  const hash = await bcrypt.hash("genia2024", 12);
  const user = await prisma.user.upsert({
    where: { email: "amaury@genia.studio" },
    update: {},
    create: { name: "Amaury", email: "amaury@genia.studio", password: hash, role: "admin" },
  });
  console.log("Admin créé :", user.email, "| mot de passe : genia2024");
  await prisma.$disconnect();
}

main().catch(console.error);
