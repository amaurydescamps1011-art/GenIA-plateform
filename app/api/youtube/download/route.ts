import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import ytdl from "@distube/ytdl-core";

// GET — stream audio to browser for local download
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const url = req.nextUrl.searchParams.get("url") || "";
  if (!ytdl.validateURL(url)) {
    return NextResponse.json({ error: "URL invalide" }, { status: 400 });
  }

  try {
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[<>:"/\|?*]/g, "").trim();
    const format = ytdl.chooseFormat(info.formats, { quality: "highestaudio", filter: "audioonly" });
    const ext = format.container === "mp4" ? "m4a" : "webm";
    const mimeType = format.container === "mp4" ? "audio/mp4" : "audio/webm";

    const stream = ytdl(url, { format });

    const readable = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk: Buffer) => controller.enqueue(chunk));
        stream.on("end", () => controller.close());
        stream.on("error", (err: Error) => controller.error(err));
      },
      cancel() { stream.destroy(); },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${title}.${ext}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Échec du téléchargement" }, { status: 500 });
  }
}

// POST — save audio to assets database
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { url } = await req.json();
  if (!ytdl.validateURL(url)) {
    return NextResponse.json({ error: "URL invalide" }, { status: 400 });
  }

  try {
    const info = await ytdl.getInfo(url);
    const { videoDetails } = info;
    const title = videoDetails.title;
    const format = ytdl.chooseFormat(info.formats, { quality: "highestaudio", filter: "audioonly" });
    const ext = format.container === "mp4" ? "m4a" : "webm";
    const mimeType = format.container === "mp4" ? "audio/mp4" : "audio/webm";

    const stream = ytdl(url, { format });
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("end", resolve);
      stream.on("error", reject);
    });

    const buffer = Buffer.concat(chunks);
    const safeName = `yt-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, safeName), buffer);

    const asset = await prisma.asset.create({
      data: {
        name: title,
        description: `Source YouTube : ${url}`,
        fileName: `${title}.${ext}`,
        fileType: "audio",
        fileSize: buffer.length,
        mimeType,
        category: "audio",
        tags: "youtube",
        url: `/uploads/${safeName}`,
        uploadedBy: user.id,
      },
      include: { user: { select: { name: true, email: true } } },
    });

    return NextResponse.json(asset);
  } catch {
    return NextResponse.json({ error: "Échec de la sauvegarde" }, { status: 500 });
  }
}
