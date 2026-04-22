"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const FILE_TYPES = ["all", "image", "video", "audio", "pdf", "font", "archive", "other"];

type Asset = {
  id: string;
  name: string;
  description: string;
  fileType: string;
  fileSize: number;
  mimeType: string;
  category: string;
  url: string;
  createdAt: string;
  user: { name: string | null; email: string };
};

type User = { id: string; name?: string | null; email: string; role: string };

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + " o";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " Ko";
  return (bytes / (1024 * 1024)).toFixed(1) + " Mo";
}

function fileIcon(type: string) {
  const icons: Record<string, string> = { image: "🖼", video: "🎬", audio: "🎵", pdf: "📄", font: "🔤", archive: "📦", other: "📎" };
  return icons[type] || "📎";
}

export default function MediathequeClient({ currentUser }: { currentUser: User }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState("");
  const [fileType, setFileType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<Asset | null>(null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ name: "", description: "", category: "image" });

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ shared: "true" });
    if (search) params.set("q", search);
    if (fileType !== "all") params.set("category", fileType);
    const res = await fetch(`/api/assets?${params}`);
    const data = await res.json();
    setAssets(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [search, fileType]);

  useEffect(() => {
    const t = setTimeout(fetchAssets, 300);
    return () => clearTimeout(t);
  }, [fetchAssets]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("name", form.name || file.name.replace(/\.[^.]+$/, ""));
    fd.append("description", form.description);
    fd.append("category", form.category);
    fd.append("clientId", "");
    fd.append("projectId", "");
    const res = await fetch("/api/assets", { method: "POST", body: fd });
    if (res.ok) {
      const a = await res.json();
      setAssets(prev => [a, ...prev]);
      setForm({ name: "", description: "", category: "image" });
      if (fileRef.current) fileRef.current.value = "";
    }
    setUploading(false);
  }

  async function deleteAsset(id: string) {
    await fetch("/api/assets/" + id, { method: "DELETE" });
    setAssets(prev => prev.filter(a => a.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(window.location.origin + url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Left panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Toolbar */}
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", flexShrink: 0 }}>
          <input className="genia-input" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: "160px", maxWidth: "260px" }} />
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {FILE_TYPES.map(t => (
              <button key={t} onClick={() => setFileType(t)}
                style={{ padding: "0.25rem 0.6rem", borderRadius: "6px", fontSize: "0.75rem", cursor: "pointer", border: "1px solid " + (fileType === t ? "var(--accent)" : "var(--border)"), background: fileType === t ? "var(--accent-dim)" : "transparent", color: fileType === t ? "var(--accent)" : "var(--text-muted)", fontWeight: fileType === t ? 600 : 400 }}>
                {t === "all" ? "Tous" : t}
              </button>
            ))}
          </div>
        </div>

        {/* Upload form */}
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Ajouter un média partagé</p>
          <form onSubmit={handleUpload} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "flex-end" }}>
            <input className="genia-input" placeholder="Nom du fichier" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              style={{ width: "180px" }} />
            <select className="genia-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              style={{ width: "120px" }}>
              {FILE_TYPES.filter(t => t !== "all").map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <label style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.875rem", borderRadius: "8px", border: "1px dashed var(--border)", fontSize: "0.82rem", color: "var(--text-muted)", cursor: uploading ? "wait" : "pointer" }}>
              {uploading ? "Upload..." : "📎 Choisir un fichier"}
              <input ref={fileRef} type="file" style={{ display: "none" }} disabled={uploading} />
            </label>
            <button className="genia-btn" type="submit" disabled={uploading} style={{ padding: "0.4rem 1rem", fontSize: "0.82rem" }}>
              {uploading ? "..." : "Ajouter"}
            </button>
          </form>
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem" }}>
          {loading ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Chargement...</p>
          ) : assets.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)", background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: "12px" }}>
              <p style={{ fontSize: "2rem", margin: "0 0 0.5rem" }}>🗂</p>
              <p style={{ margin: 0 }}>Aucun média partagé pour l&apos;instant</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.875rem" }}>
              {assets.map(a => (
                <div key={a.id} onClick={() => setSelected(a)}
                  style={{ background: "var(--surface)", border: "1px solid " + (selected?.id === a.id ? "var(--accent)" : "var(--border)"), borderRadius: "10px", overflow: "hidden", cursor: "pointer", transition: "border-color 0.15s" }}>
                  <div style={{ height: "100px", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    {a.fileType === "image"
                      ? <img src={a.url} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      : <span style={{ fontSize: "2.5rem" }}>{fileIcon(a.fileType)}</span>}
                  </div>
                  <div style={{ padding: "0.5rem 0.625rem" }}>
                    <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</p>
                    <p style={{ margin: "0.15rem 0 0", fontSize: "0.62rem", color: "var(--text-muted)" }}>{formatSize(a.fileSize)} · {a.user.name || a.user.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div style={{ width: "280px", borderLeft: "1px solid var(--border)", background: "var(--surface)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 700 }}>Détails</p>
            <button onClick={() => setSelected(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.1rem", lineHeight: 1, padding: 0 }}>×</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }}>
            <div style={{ height: "140px", background: "var(--bg)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem", overflow: "hidden" }}>
              {selected.fileType === "image"
                ? <img src={selected.url} alt={selected.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                : <span style={{ fontSize: "3.5rem" }}>{fileIcon(selected.fileType)}</span>}
            </div>
            <p style={{ margin: "0 0 0.25rem", fontWeight: 700, fontSize: "0.9rem" }}>{selected.name}</p>
            <p style={{ margin: "0 0 1rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {selected.fileType} · {formatSize(selected.fileSize)}<br />
              Ajouté par {selected.user.name || selected.user.email}
            </p>
            <button onClick={() => copyUrl(selected.url)} className="genia-btn"
              style={{ width: "100%", fontSize: "0.8rem", marginBottom: "0.5rem" }}>
              {copied ? "✓ Copié !" : "Copier le lien"}
            </button>
            <a href={selected.url} target="_blank" rel="noopener noreferrer"
              style={{ display: "block", textAlign: "center", padding: "0.4rem", fontSize: "0.8rem", color: "var(--accent)", textDecoration: "none" }}>
              Ouvrir ↗
            </a>
            {selected.user.email === currentUser.email && (
              <button onClick={() => deleteAsset(selected.id)}
                style={{ width: "100%", marginTop: "1rem", padding: "0.4rem", fontSize: "0.78rem", borderRadius: "6px", border: "1px solid #ef4444", background: "transparent", color: "#ef4444", cursor: "pointer" }}>
                Supprimer
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
