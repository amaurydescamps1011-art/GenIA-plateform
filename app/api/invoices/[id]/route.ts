import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  const { id } = await params;
  const inv = await prisma.invoice.findFirst({ where: { id, createdBy: user.id } });
  if (!inv) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(inv);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const items = body.items !== undefined ? JSON.stringify(body.items) : undefined;
  const subtotal = body.items ? body.items.reduce((s:number,i:any)=>s+(i.qty*i.unitPrice),0) : undefined;
  const taxRate = body.taxRate ?? undefined;
  const taxAmount = subtotal !== undefined ? Math.round(subtotal * (taxRate||20) / 100 * 100) / 100 : undefined;
  const total = subtotal !== undefined ? Math.round((subtotal + (taxAmount||0)) * 100) / 100 : undefined;
  const inv = await prisma.invoice.updateMany({
    where: { id, createdBy: user.id },
    data: { ...(body.status&&{status:body.status}), ...(body.clientName!==undefined&&{clientName:body.clientName}), ...(body.clientEmail!==undefined&&{clientEmail:body.clientEmail}), ...(body.clientAddress!==undefined&&{clientAddress:body.clientAddress}), ...(items&&{items}), ...(subtotal!==undefined&&{subtotal}), ...(taxRate!==undefined&&{taxRate}), ...(taxAmount!==undefined&&{taxAmount}), ...(total!==undefined&&{total}), ...(body.notes!==undefined&&{notes:body.notes}), ...(body.validUntil!==undefined&&{validUntil:body.validUntil}), ...(body.dueDate!==undefined&&{dueDate:body.dueDate}) },
  });
  return NextResponse.json(inv);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  const { id } = await params;
  await prisma.invoice.deleteMany({ where: { id, createdBy: user.id } });
  return NextResponse.json({ ok: true });
}