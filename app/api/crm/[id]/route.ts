import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const client = await prisma.client.updateMany({
    where: { id, createdBy: user.id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.budget !== undefined && { budget: body.budget ? parseFloat(body.budget) : null }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.tags !== undefined && { tags: body.tags }),
      ...(body.contact !== undefined && { contact: body.contact }),
      ...(body.driveUrl !== undefined && { driveUrl: body.driveUrl }),
    },
  });
  return NextResponse.json(client);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  const { id } = await params;
  await prisma.client.deleteMany({ where: { id, createdBy: user.id } });
  return NextResponse.json({ ok: true });
}
