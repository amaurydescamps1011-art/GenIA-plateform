"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const CATEGORIES = ["all", "image", "video", "audio", "pdf", "font", "archive", "other"];

type Asset = {
  id: string;
  name: string;
  description: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  mimeType: string;
  category: string;
  tags: string;
  url: string;
  uploadedBy: string;
  createdAt: string;
  user: { name: string | null; email: string };
};

type User = { id: string; name?: string | null; email: string; role: string };

export default function AssetsClient({ currentUser }: { currentUser: User }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [selected, setSelected] = useState<Asset | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ name: "", description: "", category: "image", tags: "" });

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (category !== "all") params.set("category", category);
    const res = await fetch(`/api/assets?${params}`);
    const data = await res.json();
    setAssets(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [search, category]);

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
    fd.append("name", form.name || file.name);
    fd.append("description", form.description);
    fd.append("category", form.category);
    fd.append("tags", form.tags);
    await fetch("/api/assets", { method: "POST", body: fd });
    setUploading(false);
    setShowUpload(false);
    setForm({ name: "", description: "", category: "image", tags: "" });
    if (fileRef.current) fileRef.current.value = "";
    fetchAssets();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cet asset ?")) return;
    await fetch(`/api/assets/${id}`, { method: "DELETE" });
    setSelected(null);
    fetchAssets();
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  function AssetIcon({ type, url, mime }: { type: string; url: string; mime: string }) {
    if (type === "image") {
      return <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "6px" }} />;
    }
    const icons: Record<string, string> = { video: "▶", audio: "♫", pdf: "PDF", font: "Aa", archive: "⊡", other: "◻" };
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", color: "var(--text-muted)", background: "var(--surface2)", borderRadius: "6px" }}>
        {icons[type] || "◻"}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Assets</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "0.2rem" }}>Bibliothèque partagée de ressources</p>
        </div>
        <button className="genia-btn" onClick={() => setShowUpload(true)}>+ Ajouter un asset</button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <input
          className="genia-input"
          style={{ maxWidth: "280px" }}
          placeholder="Rechercher..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)} style={{
              padding: "0.375rem 0.75rem",
              borderRadius: "6px",
              border: "1px solid var(--border)",
              background: category === c ? "var(--text)" : "transparent",
              color: category === c ? "var(--bg)" : "var(--text-muted)",
              fontSize: "0.8rem",
              cursor: "pointer",
              fontWeight: category === c ? 600 : 400,
            }}>
              {c === "all" ? "Tous" : c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ color: "var(--text-muted)", padding: "3rem", textAlign: "center" }}>Chargement...</div>
      ) : assets.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
          <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>◈</p>
          <p>Aucun asset trouvé</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem" }}>
          {assets.map(asset => (
            <div key={asset.id} onClick={() => setSelected(asset)} className="genia-card" style={{ cursor: "pointer", overflow: "hidden", transition: "border-color 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}>
              <div style={{ height: "110px", padding: "0.5rem" }}>
                <AssetIcon type={asset.fileType} url={asset.url} mime={asset.mimeType} />
              </div>
              <div style={{ padding: "0.625rem 0.75rem", borderTop: "1px solid var(--border)" }}>
                <p style={{ fontSize: "0.8rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{asset.name}</p>
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{formatSize(asset.fileSize)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <Modal onClose={() => setShowUpload(false)} title="Ajouter un asset">
          <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Fichier *</label>
              <input ref={fileRef} type="file" required style={{ ...inputStyleBase, cursor: "pointer", paddingTop: "0.5rem" }} />
            </div>
            <div>
              <label style={labelStyle}>Nom</label>
              <input className="genia-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nom de l'asset (optionnel)" />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <input className="genia-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description courte" />
            </div>
            <div>
              <label style={labelStyle}>Catégorie</label>
              <select className="genia-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.filter(c => c !== "all").map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Tags (séparés par des virgules)</label>
              <input className="genia-input" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="logo, branding, 2024..." />
            </div>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button type="button" className="genia-btn genia-btn-ghost" onClick={() => setShowUpload(false)}>Annuler</button>
              <button type="submit" className="genia-btn" disabled={uploading}>{uploading ? "Upload..." : "Ajouter"}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Asset detail Modal */}
      {selected && (
        <Modal onClose={() => setSelected(null)} title={selected.name} wide>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div style={{ background: "var(--surface2)", borderRadius: "8px", minHeight: "220px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {selected.fileType === "image" ? (
                <img src={selected.url} alt={selected.name} style={{ maxWidth: "100%", maxHeight: "300px", objectFit: "contain", borderRadius: "6px" }} />
              ) : (
                <span style={{ fontSize: "4rem", color: "var(--text-muted)" }}>◈</span>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <Row label="Fichier" value={selected.fileName} />
              <Row label="Type" value={selected.fileType} />
              <Row label="Taille" value={formatSize(selected.fileSize)} />
              <Row label="Catégorie" value={selected.category} />
              {selected.tags && <Row label="Tags" value={selected.tags} />}
              {selected.description && <Row label="Description" value={selected.description} />}
              <Row label="Uploadé par" value={selected.user.name || selected.user.email} />
              <Row label="Date" value={new Date(selected.createdAt).toLocaleDateString("fr-FR")} />
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "auto", paddingTop: "0.5rem" }}>
                <a href={selected.url} download className="genia-btn" style={{ flex: 1, textAlign: "center" }}>Télécharger</a>
                {(selected.uploadedBy === currentUser.id || currentUser.role === "admin") && (
                  <button onClick={() => handleDelete(selected.id)} style={{ padding: "0.625rem 1rem", borderRadius: "6px", border: "1px solid rgba(255,60,60,0.4)", background: "rgba(255,60,60,0.08)", color: "#ff6b6b", cursor: "pointer", fontSize: "0.875rem" }}>
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose, title, wide }: { children: React.ReactNode; onClose: () => void; title: string; wide?: boolean }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="genia-card" style={{ width: "100%", maxWidth: wide ? "700px" : "480px", maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.25rem", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "1.5rem" }}>{children}</div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
      <p style={{ fontSize: "0.875rem", marginTop: "0.125rem", wordBreak: "break-all" }}>{value}</p>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.375rem" };
const inputStyleBase: React.CSSProperties = { width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", padding: "0.625rem 0.875rem", borderRadius: "6px", fontSize: "0.875rem" };
