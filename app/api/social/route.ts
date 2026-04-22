import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  const posts = await prisma.socialPost.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  const body = await req.json();
  const post = await prisma.socialPost.create({
    data: {
      title: body.title,
      type: body.type || "contenu",
      platform: body.platform || "all",
      status: body.status || "idee",
      scheduledAt: body.scheduledAt || "",
      publishedAt: body.publishedAt || "",
      notes: body.notes || "",
      clientId: body.clientId || "",
      clientName: body.clientName || "",
      createdBy: user.id,
    },
  });
  return NextResponse.json(post);
}
