import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  const expenses = await prisma.expense.findMany({
    where: { createdBy: user.id },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  const body = await req.json();
  const expense = await prisma.expense.create({
    data: {
      label: body.label,
      amount: parseFloat(body.amount) || 0,
      category: body.category || "autre",
      date: body.date || new Date().toISOString().split("T")[0],
      fileUrl: body.fileUrl || "",
      notes: body.notes || "",
      createdBy: user.id,
    },
  });
  return NextResponse.json(expense);
}
