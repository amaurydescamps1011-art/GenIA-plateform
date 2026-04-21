import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ stepId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  const { stepId } = await params;
  const record = await prisma.sOPStepContent.findUnique({ where: { stepId_createdBy: { stepId, createdBy: user.id } } });
  return NextResponse.json(record || { content: "", videoUrl: "" });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ stepId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  const { stepId } = await params;
  const body = await req.json();
  const record = await prisma.sOPStepContent.upsert({
    where: { stepId_createdBy: { stepId, createdBy: user.id } },
    create: { stepId, moduleId: body.moduleId || "", content: body.content ?? "", videoUrl: body.videoUrl ?? "", createdBy: user.id },
    update: { ...(body.content !== undefined && { content: body.content }), ...(body.videoUrl !== undefined && { videoUrl: body.videoUrl }) },
  });
  return NextResponse.json(record);
}