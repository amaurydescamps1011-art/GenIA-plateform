import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.portfolio.findMany({
    where: { publishOnSite: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, description: true, clientName: true, fileUrl: true, thumbnailUrl: true, type: true, tags: true, createdAt: true },
  });
  return NextResponse.json(items);
}
