import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  const { id } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const uploadDir = path.join(process.cwd(), "public", "uploads", "portfolio");
  await mkdir(uploadDir, { recursive: true });
  const ext = file.name.split(".").pop() || "mp4";
  const isVideo = ["mp4", "mov", "webm", "avi"].includes(ext.toLowerCase());
  const fileName = "portfolio-" + id + "-" + Date.now() + "." + ext;
  await writeFile(path.join(uploadDir, fileName), buffer);
  const fileUrl = "/uploads/portfolio/" + fileName;
  await prisma.portfolio.updateMany({
    where: { id, createdBy: user.id },
    data: { fileUrl, type: isVideo ? "video" : "image" },
  });
  return NextResponse.json({ url: fileUrl, type: isVideo ? "video" : "image" });
}
