import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// POST: upload a local audio file and save it as a youtube-tagged asset
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const title = formData.get("title") as string;
  const youtubeUrl = formData.get("youtubeUrl") as string;

  if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = file.name.split(".").pop() || "mp3";
  const safeName = "yt-" + Date.now() + "-" + Math.random().toString(36).slice(2) + "." + ext;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, safeName), buffer);

  const asset = await prisma.asset.create({
    data: {
      name: title || file.name.replace(/.[^.]+$/, ""),
      description: youtubeUrl ? "Source YouTube : " + youtubeUrl : "",
      fileName: file.name,
      fileType: "audio",
      fileSize: file.size,
      mimeType: file.type || "audio/mpeg",
      category: "audio",
      tags: "youtube",
      url: "/uploads/" + safeName,
      uploadedBy: user.id,
    },
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json(asset);
}