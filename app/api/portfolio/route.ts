import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  const items = await prisma.portfolio.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  const body = await req.json();
  const item = await prisma.portfolio.create({
    data: {
      title: body.title,
      description: body.description || "",
      clientId: body.clientId || "",
      clientName: body.clientName || "",
      fileUrl: body.fileUrl || "",
      thumbnailUrl: body.thumbnailUrl || "",
      type: body.type || "video",
      tags: body.tags || "",
      publishOnSite: body.publishOnSite ?? false,
      createdBy: user.id,
    },
  });
  return NextResponse.json(item);
}
