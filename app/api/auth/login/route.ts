import { NextRequest, NextResponse } from "next/server";
import { verifyUser, createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }
  const user = await verifyUser(email, password);
  if (!user) {
    return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
  }
  const token = await createSession(user.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("genia_session", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
  return res;
}
