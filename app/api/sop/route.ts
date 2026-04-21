import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  const contents = await prisma.sOPContent.findMany({ where: { createdBy: user.id } });
  const map: Record<string,string> = {};
  for (const c of contents) map[c.moduleId] = c.content;
  return NextResponse.json(map);
}