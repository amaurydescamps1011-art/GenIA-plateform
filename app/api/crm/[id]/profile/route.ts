import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  const { id } = await params;

  const [client, invoices, todos, portfolio, socialPosts] = await Promise.all([
    prisma.client.findFirst({ where: { id, createdBy: user.id } }),
    prisma.invoice.findMany({ where: { clientId: id, createdBy: user.id }, orderBy: { createdAt: "desc" } }),
    prisma.todo.findMany({ where: { clientId: id, createdBy: user.id }, orderBy: { createdAt: "desc" } }),
    prisma.portfolio.findMany({ where: { clientId: id, createdBy: user.id }, orderBy: { createdAt: "desc" } }),
    prisma.socialPost.findMany({ where: { clientId: id, createdBy: user.id }, orderBy: { createdAt: "desc" } }),
  ]);

  if (!client) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  return NextResponse.json({ client, invoices, todos, portfolio, socialPosts });
}
