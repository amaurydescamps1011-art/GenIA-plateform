import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import ytdl from "@distube/ytdl-core";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const url = req.nextUrl.searchParams.get("url") || "";
  if (!ytdl.validateURL(url)) {
    return NextResponse.json({ error: "URL YouTube invalide" }, { status: 400 });
  }

  try {
    const info = await ytdl.getInfo(url);
    const { videoDetails } = info;
    return NextResponse.json({
      title: videoDetails.title,
      channel: videoDetails.author.name,
      duration: parseInt(videoDetails.lengthSeconds),
      thumbnail: videoDetails.thumbnails.at(-1)?.url ?? null,
      videoId: videoDetails.videoId,
    });
  } catch {
    return NextResponse.json({ error: "Impossible de récupérer les informations de la vidéo" }, { status: 500 });
  }
}
