import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  await prisma.expense.updateMany({
    where: { id, createdBy: user.id },
    data: {
      ...(body.label !== undefined && { label: body.label }),
      ...(body.amount !== undefined && { amount: parseFloat(body.amount) || 0 }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.date !== undefined && { date: body.date }),
      ...(body.fileUrl !== undefined && { fileUrl: body.fileUrl }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  const { id } = await params;
  await prisma.expense.deleteMany({ where: { id, createdBy: user.id } });
  return NextResponse.json({ ok: true });
}
