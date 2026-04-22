"use client";

import { useState, useEffect, useCallback } from "react";

const TYPES = [
  { key: "image", label: "Image", icon: "🖼" },
  { key: "video", label: "Vidéo", icon: "🎬" },
  { key: "audio", label: "Audio", icon: "🎵" },
  { key: "pdf", label: "PDF / Doc", icon: "📄" },
  { key: "font", label: "Police", icon: "🔤" },
  { key: "archive", label: "Archive", icon: "📦" },
  { key: "other", label: "Autre", icon: "📎" },
];

type Asset = {
  id: string;
  name: string;
  description: string;
  fileType: string;
  category: string;
  url: string;
  clientId: string;
  projectId: string;
  createdAt: string;
  user: { name: string | null; email: string };
};

type Client = { id: string; name: string };
type Project = { id: string; title: string; clientId: string };
type User = { id: string; name?: string | null; email: string; role: string };

function driveFileId(url: string): string | null {
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/) ?? url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

function driveThumbnail(url: string): string | null {
  const id = driveFileId(url);
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w400` : null;
}

function driveViewUrl(url: string): string {
  const id = driveFileId(url);
  return id ? `https://drive.google.com/file/d/${id}/view` : url;
}

function typeIcon(type: string) {
  return TYPES.find(t => t.key === type)?.icon ?? "📎";
}

export default function MediathequeClient({ currentUser }: { currentUser: User }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterClient, setFilterClient] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Asset | null>(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({ name: "", url: "", category: "image", description: "" });
  const [formError, setFormError] = useState("");

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ shared: "true" });
    if (search) params.set("q", search);
    if (filterType !== "all") params.set("category", filterType);
    if (filterClient) params.set("clientId", filterClient);
    const res = await fetch(`/api/assets?${params}`);
    const data = await res.json();
    setAssets(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [search, filterType, filterClient]);

  useEffect(() => {
    const t = setTimeout(fetchAssets, 300);
    return () => clearTimeout(t);
  }, [fetchAssets]);

  useEffect(() => {
    fetch("/api/crm").then(r => r.ok ? r.json() : []).then((d: Client[]) => setClients(Array.isArray(d) ? d : []));
    fetch("/api/projects").then(r => r.ok ? r.json() : []).then((d: Project[]) => setProjects(Array.isArray(d) ? d : []));
  }, []);

  async function addAsset(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!form.name.trim() || !form.url.trim()) { setFormError("Nom et lien requis"); return; }
    if (!form.url.startsWith("http")) { setFormError("Lien invalide"); return; }
    setSaving(true);
    const res = await fetch("/api/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name.trim(), url: form.url.trim(), category: form.category, description: form.description }),
    });
    if (res.ok) {
      const a = await res.json();
      setAssets(prev => [a, ...prev]);
      setForm({ name: "", url: "", category: "image", description: "" });
    }
    setSaving(false);
  }

  async function linkAsset(clientId: string, projectId: string) {
    if (!selected) return;
    const res = await fetch("/api/assets/" + selected.id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, projectId }),
    });
    if (res.ok) {
      const updated = await res.json();
      setSelected(updated);
      setAssets(prev => prev.map(a => a.id === updated.id ? updated : a));
    }
  }

  async function deleteAsset(id: string) {
    await fetch("/api/assets/" + id, { method: "DELETE" });
    setAssets(prev => prev.filter(a => a.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  function copyLink(url: string) {
    navigator.clipboard.writeText(driveViewUrl(url));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const clientProjects = selected?.clientId
    ? projects.filter(p => p.clientId === selected.clientId)
    : [];

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Add form */}
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Ajouter un média via Google Drive
          </p>
          <form onSubmit={addAsset} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <label style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Nom</label>
              <input className="genia-input" placeholder="Logo client, charte..." value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ width: "180px" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <label style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Lien Drive partageable</label>
              <input className="genia-input" placeholder="https://drive.google.com/file/d/..." value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))} style={{ width: "320px" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <label style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Type</label>
              <select className="genia-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ width: "120px" }}>
                {TYPES.map(t => <option key={t.key} value={t.key}>{t.icon} {t.label}</option>)}
              </select>
            </div>
            <button className="genia-btn" type="submit" disabled={saving} style={{ alignSelf: "flex-end" }}>
              {saving ? "..." : "Ajouter"}
            </button>
            {formError && <p style={{ margin: 0, fontSize: "0.78rem", color: "#ef4444", alignSelf: "center" }}>{formError}</p>}
          </form>
          <p style={{ margin: "0.6rem 0 0", fontSize: "0.7rem", color: "var(--text-muted)" }}>
            Dans Drive → clic droit → Partager → "Toute personne ayant le lien" → Copier le lien
          </p>
        </div>

        {/* Filters */}
        <div style={{ padding: "0.75rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", gap: "0.625rem", flexWrap: "wrap", alignItems: "center", flexShrink: 0 }}>
          <input className="genia-input" placeholder="Rechercher..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ width: "180px" }} />
          <select className="genia-input" value={filterClient} onChange={e => setFilterClient(e.target.value)} style={{ width: "160px" }}>
            <option value="">Tous les clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
            {[{ key: "all", label: "Tous", icon: "" }, ...TYPES].map(t => (
              <button key={t.key} onClick={() => setFilterType(t.key)}
                style={{ padding: "0.2rem 0.55rem", borderRadius: "5px", fontSize: "0.72rem", cursor: "pointer", border: "1px solid " + (filterType === t.key ? "var(--accent)" : "var(--border)"), background: filterType === t.key ? "var(--accent-dim)" : "transparent", color: filterType === t.key ? "var(--accent)" : "var(--text-muted)", fontWeight: filterType === t.key ? 600 : 400 }}>
                {t.icon} {t.label || "Tous"}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem" }}>
          {loading ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Chargement...</p>
          ) : assets.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)", background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: "12px" }}>
              <p style={{ fontSize: "2rem", margin: "0 0 0.5rem" }}>🗂</p>
              <p style={{ margin: 0, fontSize: "0.85rem" }}>Aucun média — ajoute un lien Drive ci-dessus</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "0.875rem" }}>
              {assets.map(a => {
                const thumb = driveThumbnail(a.url);
                const client = clients.find(c => c.id === a.clientId);
                const project = projects.find(p => p.id === a.projectId);
                const isActive = selected?.id === a.id;
                return (
                  <div key={a.id} onClick={() => setSelected(a)}
                    style={{ background: "var(--surface)", border: "1px solid " + (isActive ? "var(--accent)" : "var(--border)"), borderRadius: "10px", overflow: "hidden", cursor: "pointer", transition: "border-color 0.15s" }}>
                    <div style={{ height: "110px", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      {thumb
                        ? <img src={thumb} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        : <span style={{ fontSize: "2.5rem" }}>{typeIcon(a.fileType)}</span>}
                    </div>
                    <div style={{ padding: "0.5rem 0.75rem" }}>
                      <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</p>
                      {client
                        ? <p style={{ margin: "0.15rem 0 0", fontSize: "0.62rem", color: "var(--accent)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {client.name}{project ? ` · ${project.title}` : ""}
                          </p>
                        : <p style={{ margin: "0.15rem 0 0", fontSize: "0.62rem", color: "var(--text-muted)" }}>{typeIcon(a.fileType)} {TYPES.find(t => t.key === a.fileType)?.label ?? a.fileType}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div style={{ width: "280px", borderLeft: "1px solid var(--border)", background: "var(--surface)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 700 }}>Détails</p>
            <button onClick={() => setSelected(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.2rem", lineHeight: 1, padding: 0 }}>×</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }}>
            {/* Preview */}
            {(() => { const thumb = driveThumbnail(selected.url); return thumb ? (
              <div style={{ height: "130px", background: "var(--bg)", borderRadius: "8px", overflow: "hidden", marginBottom: "1rem" }}>
                <img src={thumb} alt={selected.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }} />
              </div>
            ) : (
              <div style={{ height: "80px", background: "var(--bg)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem", fontSize: "2.5rem" }}>
                {typeIcon(selected.fileType)}
              </div>
            ); })()}

            <p style={{ margin: "0 0 0.2rem", fontWeight: 700, fontSize: "0.9rem" }}>{selected.name}</p>
            <p style={{ margin: "0 0 1.25rem", fontSize: "0.72rem", color: "var(--text-muted)" }}>
              {TYPES.find(t => t.key === selected.fileType)?.label} · ajouté par {selected.user.name || selected.user.email}
            </p>

            {/* Lier à */}
            <p style={{ margin: "0 0 0.5rem", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Lier à</p>
            <select className="genia-input" style={{ width: "100%", marginBottom: "0.5rem", fontSize: "0.82rem" }}
              value={selected.clientId || ""}
              onChange={e => linkAsset(e.target.value, "")}>
              <option value="">— Aucun client —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {selected.clientId && (
              <select className="genia-input" style={{ width: "100%", marginBottom: "0.75rem", fontSize: "0.82rem" }}
                value={selected.projectId || ""}
                onChange={e => linkAsset(selected.clientId, e.target.value)}>
                <option value="">— Aucun projet —</option>
                {clientProjects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            )}
            {selected.clientId && (
              <p style={{ margin: "0 0 1rem", fontSize: "0.72rem", color: "var(--accent)" }}>
                ✓ {clients.find(c => c.id === selected.clientId)?.name}
                {selected.projectId && ` · ${projects.find(p => p.id === selected.projectId)?.title}`}
              </p>
            )}

            <button onClick={() => copyLink(selected.url)} className="genia-btn" style={{ width: "100%", fontSize: "0.8rem", marginBottom: "0.5rem" }}>
              {copied ? "✓ Lien copié !" : "Copier le lien"}
            </button>
            <a href={driveViewUrl(selected.url)} target="_blank" rel="noopener noreferrer"
              style={{ display: "block", textAlign: "center", padding: "0.4rem", fontSize: "0.8rem", color: "var(--accent)", textDecoration: "none" }}>
              Ouvrir dans Drive ↗
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
