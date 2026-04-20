import { PrismaClient } from "@prisma/client";
import Database from "better-sqlite3";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "dev.db");

function createPrismaClient() {
  const url = "file:" + dbPath.replace(/\\/g, "/");
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter } as Parameters<typeof PrismaClient>[0]);
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
