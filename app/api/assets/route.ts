import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const clientId = searchParams.get("clientId") || "";
  const projectId = searchParams.get("projectId") || "";

  const assets = await prisma.asset.findMany({
    where: {
      uploadedBy: user.id,
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

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;
  const tags = formData.get("tags") as string;
  const clientId = (formData.get("clientId") as string) || "";
  const projectId = (formData.get("projectId") as string) || "";

  if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const ext = path.extname(file.name);
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const filePath = path.join(uploadDir, safeName);
  await writeFile(filePath, buffer);

  const asset = await prisma.asset.create({
    data: {
      name: name || file.name,
      description: description || "",
      fileName: file.name,
      fileType: getFileType(file.type),
      fileSize: file.size,
      mimeType: file.type,
      category: category || "autre",
      tags: tags || "",
      url: `/uploads/${safeName}`,
      clientId,
      projectId,
      uploadedBy: user.id,
    },
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json(asset);
}

function getFileType(mime: string): string {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.includes("pdf")) return "pdf";
  if (mime.includes("font") || mime.includes("ttf") || mime.includes("woff")) return "font";
  if (mime.includes("zip") || mime.includes("rar") || mime.includes("tar")) return "archive";
  return "other";
}
