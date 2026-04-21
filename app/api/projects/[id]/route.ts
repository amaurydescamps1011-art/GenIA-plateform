import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const project = await prisma.project.updateMany({
    where: { id, createdBy: user.id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.script !== undefined && { script: body.script }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.checklist !== undefined && { checklist: body.checklist }),
      ...(body.dueDate !== undefined && { dueDate: body.dueDate }),
    },
  });
  return NextResponse.json(project);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.project.deleteMany({ where: { id, createdBy: user.id } });
  return NextResponse.json({ ok: true });
}
