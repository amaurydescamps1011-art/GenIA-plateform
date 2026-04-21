"use client";

import { useState, useEffect, useRef } from "react";

interface VideoInfo { title: string; channel: string; duration: number; thumbnail: string | null; videoId: string; }
interface Asset { id: string; name: string; url: string; fileSize: number; mimeType: string; tags: string; createdAt: string; user: { name: string | null; email: string }; }

function formatDuration(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return h + ":" + String(m).padStart(2,"0") + ":" + String(sec).padStart(2,"0");
  return m + ":" + String(sec).padStart(2,"0");
}
function formatSize(b: number) { return b < 1048576 ? (b/1024).toFixed(0)+" Ko" : (b/1048576).toFixed(1)+" Mo"; }

export default function YoutubeClient({ user }: { user: { id: string; name?: string|null; email: string; role: string } }) {
  const [url, setUrl] = useState("");
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [savedAssets, setSavedAssets] = useState<Asset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [toast, setToast] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadSavedAssets(); }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  async function loadSavedAssets() {
    setAssetsLoading(true);
    try {
      const res = await fetch("/api/assets?q=youtube&category=audio");
      if (res.ok) { const d: Asset[] = await res.json(); setSavedAssets(d.filter(a => a.tags?.includes("youtube"))); }
    } finally { setAssetsLoading(false); }
  }

  async function handleFetch() {
    setFetchError(""); setVideoInfo(null); if (!url.trim()) return;
    setFetchLoading(true);
    try {
      const res = await fetch("/api/youtube/info?url=" + encodeURIComponent(url));
      const d = await res.json();
      if (!res.ok) { setFetchError(d.error || "Erreur"); return; }
      setVideoInfo(d);
    } catch { setFetchError("Erreur reseau"); } finally { setFetchLoading(false); }
  }

  async function handleDownload() {
    if (!url) return; setDownloadLoading(true);
    try {
      const res = await fetch("/api/youtube/download?url=" + encodeURIComponent(url));
      if (!res.ok) { setToast("Echec du telechargement"); return; }
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition") || "";
      const fnMatch = cd.match(/filename="([^"]+)"/);
      const fn = fnMatch ? fnMatch[1] : (videoInfo?.title || "audio") + ".webm";
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = fn; a.click(); URL.revokeObjectURL(a.href);
      setToast("Telechargement demarre !");
    } catch { setToast("Erreur telechargement"); } finally { setDownloadLoading(false); }
  }

  async function handleSaveToAssets() {
    if (!url) return; setSaveLoading(true);
    try {
      const res = await fetch("/api/youtube/download", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }),
      });
      const d = await res.json();
      if (!res.ok) { setToast(d.error || "Erreur"); return; }
      setToast("Audio sauvegarde dans les Assets !"); setSavedAssets(p => [d, ...p]);
    } catch { setToast("Erreur sauvegarde"); } finally { setSaveLoading(false); }
  }

  const card: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px" };

  return (
    <div style={{ maxWidth: "800px" }}>
      {toast && (
        <div style={{ position: "fixed", top: "1.5rem", right: "1.5rem", zIndex: 9999, background: "var(--accent)", color: "#fff", padding: "0.75rem 1.25rem", borderRadius: "8px", fontSize: "0.875rem", fontWeight: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
          {toast}
        </div>
      )}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>YouTube vers Audio</h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Telechargez l audio ou sauvegardez-le dans vos Assets.</p>
      </div>
      <div style={{ ...card, padding: "1.5rem", marginBottom: "1.5rem" }}>
        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>URL YouTube</label>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <input ref={inputRef} type="url" value={url} onChange={e => { setUrl(e.target.value); setVideoInfo(null); setFetchError(""); }} onKeyDown={e => e.key === "Enter" && handleFetch()} placeholder="https://www.youtube.com/watch?v=..." className="genia-input" style={{ flex: 1 }} />
          <button onClick={handleFetch} disabled={fetchLoading || !url.trim()} className="genia-btn" style={{ whiteSpace: "nowrap" }}>{fetchLoading ? "Chargement..." : "Recuperer"}</button>
        </div>
        {fetchError && <p style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#ef4444" }}>{fetchError}</p>}
      </div>
      {videoInfo && (
        <div style={{ ...card, overflow: "hidden", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", gap: "1rem", padding: "1.25rem" }}>
            {videoInfo.thumbnail && (
              <img src={videoInfo.thumbnail} alt={videoInfo.title} style={{ width: "160px", height: "90px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.25rem" }}>{videoInfo.title}</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>{videoInfo.channel}</p>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Duree : {formatDuration(videoInfo.duration)}</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", padding: "1rem 1.25rem", borderTop: "1px solid var(--border)" }}>
            <button onClick={handleDownload} disabled={downloadLoading || saveLoading} className="genia-btn">{downloadLoading ? "Telechargement..." : "Telecharger"}</button>
            <button onClick={handleSaveToAssets} disabled={saveLoading || downloadLoading} className="genia-btn genia-btn-ghost">{saveLoading ? "Sauvegarde..." : "Sauvegarder dans les Assets"}</button>
          </div>
        </div>
      )}
      <div>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Audios sauvegardes ({savedAssets.length})</h2>
        {assetsLoading ? (
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Chargement...</p>
        ) : savedAssets.length === 0 ? (
          <div style={{ ...card, padding: "2rem", textAlign: "center" }}>
            <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>&#9835;</p>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Aucun audio YouTube sauvegarde.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {savedAssets.map(asset => (
              <div key={asset.id} style={{ ...card, borderRadius: "8px", padding: "0.875rem 1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>&#9835;</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.875rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{asset.name}</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{formatSize(asset.fileSize)} - {new Date(asset.createdAt).toLocaleDateString("fr-FR")}</p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                  <a href={asset.url} download className="genia-btn genia-btn-ghost" style={{ fontSize: "0.75rem", padding: "0.3rem 0.65rem" }}>Telecharger</a>
                  <a href="/dashboard/assets" className="genia-btn genia-btn-ghost" style={{ fontSize: "0.75rem", padding: "0.3rem 0.65rem" }}>Voir Assets</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
