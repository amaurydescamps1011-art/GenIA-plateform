import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ moduleId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  const { moduleId } = await params;
  const { content } = await req.json();
  const record = await prisma.sOPContent.upsert({
    where: { moduleId_createdBy: { moduleId, createdBy: user.id } },
    create: { moduleId, content, createdBy: user.id },
    update: { content },
  });
  return NextResponse.json(record);
}