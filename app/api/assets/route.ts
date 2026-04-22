import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const clientId = searchParams.get("clientId") || "";
  const projectId = searchParams.get("projectId") || "";
  const shared = searchParams.get("shared") === "true";

  const assets = await prisma.asset.findMany({
    where: {
      ...(shared ? { isPublic: true } : { uploadedBy: user.id }),
      AND: [
        search ? { OR: [{ name: { contains: search } }, { tags: { contains: search } }, { description: { contains: search } }] } : {},
        category ? { category } : {},
        clientId ? { clientId } : {},
        projectId ? { projectId } : {},
      ],
    },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(assets);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  const { name, url, category, description, tags, clientId, projectId } = body;

  if (!name || !url) return NextResponse.json({ error: "Nom et lien requis" }, { status: 400 });

  const asset = await prisma.asset.create({
    data: {
      name,
      description: description || "",
      fileName: name,
      fileType: category || "other",
      fileSize: 0,
      mimeType: "application/octet-stream",
      category: category || "other",
      tags: tags || "",
      url,
      clientId: clientId || "",
      projectId: projectId || "",
      isPublic: true,
      uploadedBy: user.id,
    },
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json(asset);
}
