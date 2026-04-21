import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

const ACCESS_PASSWORD = "123";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (password !== ACCESS_PASSWORD) {
    return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }
  const user = await prisma.user.findFirst();
  if (!user) return NextResponse.json({ error: "Aucun utilisateur" }, { status: 500 });
  const token = await createSession(user.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("genia_session", token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 30 * 24 * 60 * 60 });
  return res;
}