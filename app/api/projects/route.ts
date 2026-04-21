import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
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
  { id: "brief", label: "Brief & cahier des charges", icon: "📋", content: "", images: [], driveLinks: [] },
  { id: "script", label: "Script / Voix off", icon: "✍️", content: "", images: [], driveLinks: [] },
  { id: "storyboard", label: "Storyboard", icon: "🎨", content: "", images: [], driveLinks: [] },
  { id: "tournage", label: "Plan de tournage", icon: "🎬", content: "", images: [], driveLinks: [] },
  { id: "assets", label: "Assets & ressources", icon: "📁", content: "", images: [], driveLinks: [] },
  { id: "montage", label: "Montage", icon: "✂️", content: "", images: [], driveLinks: [] },
  { id: "revision", label: "Révision client", icon: "👁", content: "", images: [], driveLinks: [] },
  { id: "livraison", label: "Livraison finale", icon: "📦", content: "", images: [], driveLinks: [] },
]);

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
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
