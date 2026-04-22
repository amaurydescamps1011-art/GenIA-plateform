import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  await prisma.portfolio.updateMany({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.clientId !== undefined && { clientId: body.clientId }),
      ...(body.clientName !== undefined && { clientName: body.clientName }),
      ...(body.fileUrl !== undefined && { fileUrl: body.fileUrl }),
      ...(body.thumbnailUrl !== undefined && { thumbnailUrl: body.thumbnailUrl }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.tags !== undefined && { tags: body.tags }),
      ...(body.publishOnSite !== undefined && { publishOnSite: body.publishOnSite }),
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  const { id } = await params;
  await prisma.portfolio.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
