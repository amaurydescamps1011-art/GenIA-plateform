import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

async function nextNumber(userId: string, type: string) {
  const year = new Date().getFullYear();
  const prefix = type === "devis" ? "DEV" : type === "acompte" ? "ACP" : "FAC";
  const count = await prisma.invoice.count({ where: { createdBy: userId, type } });
  return prefix + "-" + year + "-" + String(count + 1).padStart(3, "0");
}

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
  const items = JSON.stringify(body.items || []);
  const subtotal = (body.items||[]).reduce((s:number,i:any)=>s+(i.qty*i.unitPrice),0);
  const taxAmount = Math.round(subtotal * (body.taxRate || 20) / 100 * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;
  const inv = await prisma.invoice.create({
    data: { type: body.type, number, status: body.status || "brouillon", clientId: body.clientId || "", clientName: body.clientName || "", clientEmail: body.clientEmail || "", clientAddress: body.clientAddress || "", items, subtotal, taxRate: body.taxRate || 20, taxAmount, total, notes: body.notes || "", validUntil: body.validUntil || "", dueDate: body.dueDate || "", issueDate, parentId: body.parentId || "", createdBy: user.id },
  });
  return NextResponse.json(inv);
}