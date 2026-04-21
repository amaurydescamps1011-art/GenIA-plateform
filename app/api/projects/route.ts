import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = req.nextUrl.searchParams.get("clientId");
  const where = clientId
    ? { createdBy: user.id, clientId }
    : { createdBy: user.id };

  const projects = await prisma.project.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(projects);
}

const DEFAULT_CHECKLIST = JSON.stringify([
  { id: "1", label: "Brief client validé", done: false },
  { id: "2", label: "Script rédigé", done: false },
  { id: "3", label: "Storyboard / plan de tournage", done: false },
  { id: "4", label: "Tournage effectué", done: false },
  { id: "5", label: "Montage v1", done: false },
  { id: "6", label: "Révision client", done: false },
  { id: "7", label: "Corrections finales", done: false },
  { id: "8", label: "Livraison finale", done: false },
  { id: "9", label: "Facture envoyée", done: false },
  { id: "10", label: "Paiement reçu", done: false },
]);

export async function POST(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const project = await prisma.project.create({
    data: {
      title: body.title || "Nouveau projet",
      clientId: body.clientId || "",
      clientName: body.clientName || "",
      status: body.status || "en_cours",
      script: body.script || "",
      notes: body.notes || "",
      checklist: body.checklist || DEFAULT_CHECKLIST,
      dueDate: body.dueDate || "",
      createdBy: user.id,
    },
  });
  return NextResponse.json(project, { status: 201 });
}
