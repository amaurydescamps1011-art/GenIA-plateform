import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) return NextResponse.json({ error: "Asset non trouvé" }, { status: 404 });

  if (asset.uploadedBy !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const filePath = path.join(process.cwd(), "public", asset.url);
  await unlink(filePath).catch(() => {});
  await prisma.asset.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
