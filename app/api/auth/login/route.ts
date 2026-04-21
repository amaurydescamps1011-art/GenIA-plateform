import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (!password) return NextResponse.json({ error: "Mot de passe requis" }, { status: 400 });

  // Find user whose bcrypt password matches
  const users = await prisma.user.findMany();
  let matched = null;
  for (const u of users) {
    const valid = await bcrypt.compare(password, u.password);
    if (valid) { matched = u; break; }
  }

  if (!matched) return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });

  const token = await createSession(matched.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("genia_session", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
  return res;
}
