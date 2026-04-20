import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("genia_session")?.value;
  if (token) await deleteSession(token);
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("genia_session");
  return res;
}
