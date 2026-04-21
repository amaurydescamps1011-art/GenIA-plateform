import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

async function nextNumber(userId: string, type: string) {
  const year = new Date().getFullYear();
  const prefix = type === "devis" ? "DEV" : type === "acompte" ? "ACP" : "FAC";
  const count = await prisma.invoice.count({ where: { createdBy: userId, type } });
  return prefix + "-" + year + "-" + String(count + 1).padStart(3, "0");
}

const CRM_STATUS_ON_CREATE: Record<string, string> = {
  devis: "verbal",
  acompte: "acompte",
  facture: "en_cours",
};
const PIPELINE = ["prospect", "verbal", "acompte", "en_cours", "termine", "followup"];

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  const invoices = await prisma.invoice.findMany({ where: { createdBy: user.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(invoices);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  const body = await req.json();
  const number = body.number || await nextNumber(user.id, body.type);
  const issueDate = body.issueDate || new Date().toISOString().split("T")[0];
  const items = typeof body.items === "string" ? body.items : JSON.stringify(body.items || []);
  const parsedItems: Array<{ qty: number; unitPrice: number }> = JSON.parse(items);
  const subtotal = parsedItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const taxAmount = Math.round(subtotal * (body.taxRate || 20) / 100 * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  const inv = await prisma.invoice.create({
    data: {
      type: body.type, number, status: body.status || "brouillon",
      clientId: body.clientId || "", clientName: body.clientName || "",
      clientEmail: body.clientEmail || "", clientAddress: body.clientAddress || "",
      items, subtotal, taxRate: body.taxRate || 20, taxAmount, total,
      notes: body.notes || "", validUntil: body.validUntil || "",
      dueDate: body.dueDate || "", issueDate, parentId: body.parentId || "",
      createdBy: user.id,
    },
  });

  // Automation CRM : avancer le statut du client selon le type de document créé
  if (body.clientId) {
    const targetStatus = CRM_STATUS_ON_CREATE[body.type];
    if (targetStatus) {
      const client = await prisma.client.findFirst({ where: { id: body.clientId, createdBy: user.id } });
      if (client && PIPELINE.indexOf(targetStatus) > PIPELINE.indexOf(client.status)) {
        await prisma.client.update({ where: { id: body.clientId }, data: { status: targetStatus } });
      }
    }
  }

  return NextResponse.json(inv);
}
