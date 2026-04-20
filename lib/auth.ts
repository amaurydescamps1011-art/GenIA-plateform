import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function createUser(name: string, email: string, password: string, role = "user") {
  const hashed = await bcrypt.hash(password, 12);
  return prisma.user.create({
    data: { name, email, password: hashed, role },
  });
}

export async function verifyUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.password);
  return valid ? user : null;
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  await prisma.session.create({ data: { userId, token, expiresAt } });
  return token;
}

export async function getSession(token: string) {
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export async function deleteSession(token: string) {
  await prisma.session.deleteMany({ where: { token } }).catch(() => {});
}
