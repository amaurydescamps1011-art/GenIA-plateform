const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const { PrismaClient } = require('../node_modules/.prisma/client');
const path = require('path');
const bcrypt = require('bcryptjs');

async function main() {
  const dbPath = path.join(__dirname, '..', 'dev.db');
  const dbUrl = 'file:' + dbPath.replace(/\\/g, '/');
  const adapter = new PrismaBetterSqlite3({ url: dbUrl });
  const prisma = new PrismaClient({ adapter });
  const hash = await bcrypt.hash('genia2024', 12);
  const user = await prisma.user.upsert({
    where: { email: 'amaury@genia.studio' },
    update: {},
    create: { name: 'Amaury', email: 'amaury@genia.studio', password: hash, role: 'admin' },
  });
  console.log('Admin créé:', user.email, '| mot de passe: genia2024');
  await prisma.$disconnect();
}

main().catch(console.error);
