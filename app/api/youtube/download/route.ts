import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

async function getCobaltUrl(youtubeUrl: string): Promise<{ url: string; filename: string }> {
  const res = await fetch("https://api.cobalt.tools/", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({
      url: youtubeUrl,
      downloadMode: "audio",
      audioFormat: "mp3",
      filenameStyle: "basic",
    }),
  });
  if (!res.ok) throw new Error("cobalt API error: " + res.status);
  const data = await res.json();
  if (data.status === "error") throw new Error(data.error?.code || "cobalt error");
  if (!data.url) throw new Error("No URL returned by cobalt");
  return { url: data.url, filename: data.filename || "audio.mp3" };
}

// GET: redirect client to cobalt download URL
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const url = req.nextUrl.searchParams.get("url") || "";
  if (!url) return NextResponse.json({ error: "URL manquante" }, { status: 400 });

  try {
    const { url: dlUrl, filename } = await getCobaltUrl(url);
    return NextResponse.redirect(dlUrl, { headers: { "Content-Disposition": "attachment; filename=" + filename } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur inconnue";
    return NextResponse.json({ error: "Echec du telechargement: " + msg }, { status: 500 });
  }
}

// POST: download audio server-side and save to assets
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const { url, title } = await req.json();
  if (!url) return NextResponse.json({ error: "URL manquante" }, { status: 400 });

  try {
    const { url: dlUrl, filename } = await getCobaltUrl(url);

    const audioRes = await fetch(dlUrl);
    if (!audioRes.ok) throw new Error("Echec fetch audio");
    const buffer = Buffer.from(await audioRes.arrayBuffer());

    const ext = filename.split(".").pop() || "mp3";
    const safeName = "yt-" + Date.now() + "-" + Math.random().toString(36).slice(2) + "." + ext;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, safeName), buffer);

    const mimeType = ext === "mp3" ? "audio/mpeg" : "audio/" + ext;
    const assetName = title || filename.replace(/.[^.]+$/, "");

    const asset = await prisma.asset.create({
      data: {
        name: assetName,
        description: "Source YouTube : " + url,
        fileName: filename,
        fileType: "audio",
        fileSize: buffer.length,
        mimeType,
        category: "audio",
        tags: "youtube",
        url: "/uploads/" + safeName,
        uploadedBy: user.id,
      },
      include: { user: { select: { name: true, email: true } } },
    });

    return NextResponse.json(asset);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur inconnue";
    return NextResponse.json({ error: "Echec de la sauvegarde: " + msg }, { status: 500 });
  }
}