import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";

function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1).split("?")[0];
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const m = u.pathname.match(//(shorts|embed|v)/([^/?]+)/);
      if (m) return m[2];
    }
    return null;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const url = req.nextUrl.searchParams.get("url") || "";
  const videoId = extractVideoId(url);
  if (!videoId) {
    return NextResponse.json({ error: "URL YouTube invalide" }, { status: 400 });
  }

  try {
    const oembedUrl = "https://www.youtube.com/oembed?url=" + encodeURIComponent("https://www.youtube.com/watch?v=" + videoId) + "&format=json";
    const res = await fetch(oembedUrl);
    if (!res.ok) {
      return NextResponse.json({ error: "Video introuvable ou privee" }, { status: 404 });
    }
    const data = await res.json();
    return NextResponse.json({
      title: data.title,
      channel: data.author_name,
      duration: null,
      thumbnail: "https://img.youtube.com/vi/" + videoId + "/maxresdefault.jpg",
      videoId,
    });
  } catch {
    return NextResponse.json({ error: "Impossible de recuperer les informations" }, { status: 500 });
  }
}