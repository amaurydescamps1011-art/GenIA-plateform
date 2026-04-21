import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const COBALT_API = (() => { const base = process.env.COBALT_API_URL || "https://api.cobalt.tools"; return base.endsWith("/") ? base : base + "/"; })();

async function getCobaltUrl(youtubeUrl: string): Promise<{ url: string; filename: string }> {
  const res = await fetch(COBALT_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      url: youtubeUrl,
      downloadMode: "audio",
      audioFormat: "mp3",
    }),
  });
  const data = await res.json();
  if (!res.ok || data.status === "error") {
    const detail = JSON.stringify(data);
    throw new Error("cobalt " + res.status + ": " + detail);
  }
  if (!data.url) throw new Error("No URL in cobalt response: " + JSON.stringify(data));
  return { url: data.url, filename: data.filename || "audio.mp3" };
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const url = req.nextUrl.searchParams.get("url") || "";
  if (!url) return NextResponse.json({ error: "URL manquante" }, { status: 400 });

  try {
    const { url: dlUrl } = await getCobaltUrl(url);
    return NextResponse.redirect(dlUrl);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const { url, title } = await req.json();
  if (!url) return NextResponse.json({ error: "URL manquante" }, { status: 400 });

  try {
    const { url: dlUrl, filename } = await getCobaltUrl(url);

    const audioRes = await fetch(dlUrl);
    if (!audioRes.ok) throw new Error("Fetch audio echoue: " + audioRes.status);
    const buffer = Buffer.from(await audioRes.arrayBuffer());

    const ext = filename.split(".").pop() || "mp3";
    const safeName = "yt-" + Date.now() + "-" + Math.random().toString(36).slice(2) + "." + ext;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, safeName), buffer);

    const mimeType = ext === "mp3" ? "audio/mpeg" : "audio/" + ext;
    const assetName = (title as string) || filename.replace(/.[^.]+$/, "");

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
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}