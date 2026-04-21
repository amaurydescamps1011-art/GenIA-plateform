import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const TODO_BY_STATUS: Record<string, string> = {
  prospect: "Confirmer verbalement le projet avec le client",
  verbal: "Envoyer le devis et faire signer le contrat",
  acompte: "Lancer la production",
  en_cours: "Envoyer une mise a jour d avancement",
  termine: "Demander un temoignage ou avis client",
  followup: "Proposer un nouveau projet ou un upsell",
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.client.findFirst({ where: { id, createdBy: user.id } });
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const client = await prisma.client.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.budget !== undefined && { budget: body.budget !== null ? parseFloat(body.budget) : null }),
      ...(body.email !== undefined && { email: body.email }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.address !== undefined && { address: body.address }),
      ...(body.siret !== undefined && { siret: body.siret }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.tags !== undefined && { tags: body.tags }),
      ...(body.contact !== undefined && { contact: body.contact }),
      ...(body.driveUrl !== undefined && { driveUrl: body.driveUrl }),
    },
  });

  if (body.status && body.status !== existing.status) {
    const todoTitle = TODO_BY_STATUS[body.status];
    if (todoTitle) {
      await prisma.todo.create({
        data: { title: todoTitle, clientId: id, clientName: client.name, createdBy: user.id },
      });
    }
    // Quand un client est terminé : auto-créer un post social + todo de publication
    if (body.status === "termine") {
      await prisma.socialPost.create({
        data: {
          title: "Poster le projet de " + client.name,
          type: "client_project",
          platform: "all",
          status: "idee",
          clientId: id,
          clientName: client.name,
          notes: "Projet termine - a publier sur les reseaux",
          createdBy: user.id,
        },
      });
      await prisma.todo.create({
        data: {
          title: "Publier le projet de " + client.name + " sur les reseaux sociaux",
          clientId: id,
          clientName: client.name,
          createdBy: user.id,
        },
      });
    }
  }

  return NextResponse.json(client);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  const { id } = await params;
  await prisma.client.deleteMany({ where: { id, createdBy: user.id } });
  return NextResponse.json({ ok: true });
}
