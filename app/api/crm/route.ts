import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  const clients = await prisma.client.findMany({
    where: { createdBy: user.id },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  const body = await req.json();
  const client = await prisma.client.create({
    data: {
      name: body.name,
      status: body.status || "prospect",
      budget: body.budget ? parseFloat(body.budget) : null,
      notes: body.notes || "",
      tags: body.tags || "",
      contact: body.contact || "",
      driveUrl: body.driveUrl || "",
      createdBy: user.id,
    },
  });
  return NextResponse.json(client);
}
