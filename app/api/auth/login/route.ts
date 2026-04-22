import { NextRequest, NextResponse } from "next/server";
import { createSession, verifyUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: "Identifiants requis" }, { status: 400 });

  const matched = await verifyUser(email, password);
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
