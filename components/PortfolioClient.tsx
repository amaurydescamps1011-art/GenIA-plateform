"use client";
import { CSSProperties, useState, useCallback, useEffect, useRef } from "react";

type PortfolioItem = {
  id: string;
  title: string;
  description: string;
  clientId: string;
  clientName: string;
  fileUrl: string;
  thumbnailUrl: string;
  type: string;
  tags: string;
  publishOnSite: boolean;
  createdAt: string;
};
type Client = { id: string; name: string };

function today() { return new Date().toISOString().split("T")[0]; }

// ─── Item Form ────────────────────────────────────────────────────────────
function ItemForm({ initial, clients, onSave, onClose }: { initial: Partial<PortfolioItem>; clients: Client[]; onSave: (d: Partial<PortfolioItem>) => Promise<string>; onClose: () => void }) {
  const [form, setForm] = useState<Partial<PortfolioItem>>(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof PortfolioItem>(k: K, v: PortfolioItem[K]) { setForm(f => ({ ...f, [k]: v })); }

  function pickClient(id: string) {
    const c = clients.find(x => x.id === id);
    setForm(f => ({ ...f, clientId: id, clientName: c?.name || "" }));
  }

  async function handleSaveAndUpload(file?: File) {
    if (!form.title?.trim()) return;
    setSaving(true);
    const newId = await onSave(form);
    if (file && newId) {
      setUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/portfolio/" + newId + "/upload", { method: "POST", body: fd });
      if (res.ok) {
        const { url, type } = await res.json();
        await fetch("/api/portfolio/" + newId, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileUrl: url, type }) });
      }
      setUploading(false);
    }
    setSaving(false);
  }

  const lbl: CSSProperties = { fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" };
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: "var(--surface)", borderRadius: "14px", width: "100%", maxWidth: "580px", border: "1px solid var(--border)", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>{initial.id ? "Modifier" : "Ajouter au portfolio"}</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.3rem" }}>&times;</button>
        </div>
        <div style={{ padding: "1.25rem 1.5rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div>
            <label style={lbl}>Titre *</label>
            <input className="genia-input" style={{ width: "100%" }} value={form.title || ""} onChange={e => set("title", e.target.value)} placeholder="Ex: Video promo Marque X, Spot publicitaire..." autoFocus />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={lbl}>Client lie (optionnel)</label>
              <select className="genia-input" style={{ width: "100%", background: "var(--surface)", color: "var(--text)" }} value={form.clientId || ""} onChange={e => pickClient(e.target.value)}>
                <option value="">-- Aucun client --</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Tags (virgules)</label>
              <input className="genia-input" style={{ width: "100%" }} value={form.tags || ""} onChange={e => set("tags", e.target.value)} placeholder="ia, montage, promo..." />
            </div>
          </div>
          <div>
            <label style={lbl}>Description</label>
            <textarea className="genia-input" style={{ width: "100%", height: "80px", resize: "vertical" }} value={form.description || ""} onChange={e => set("description", e.target.value)} placeholder="Contexte, objectif, resultat..." />
          </div>

          {/* Upload zone */}
          <div>
            <label style={lbl}>Fichier (video ou image)</label>
            <input ref={fileRef} type="file" accept="video/*,image/*" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) setPendingFile(e.target.files[0]); }} />
            <div
              onClick={() => fileRef.current?.click()}
              style={{ border: "2px dashed var(--border)", borderRadius: "8px", padding: "1.25rem", textAlign: "center" as const, cursor: "pointer", background: pendingFile ? "var(--accent)11" : "transparent" }}
            >
              {pendingFile ? (
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--accent)", fontWeight: 600 }}>📎 {pendingFile.name}</p>
              ) : form.fileUrl ? (
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>Fichier existant · Cliquer pour remplacer</p>
              ) : (
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>Cliquer pour choisir une video ou image</p>
              )}
            </div>
          </div>

          {/* Publish toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", background: form.publishOnSite ? "#22c55e11" : "var(--bg)", border: "1px solid " + (form.publishOnSite ? "#22c55e" : "var(--border)"), borderRadius: "8px" }}>
            <input type="checkbox" id="publish" checked={form.publishOnSite ?? false} onChange={e => set("publishOnSite", e.target.checked)} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
            <div>
              <label htmlFor="publish" style={{ fontWeight: 600, fontSize: "0.88rem", cursor: "pointer" }}>Publier sur mon site web</label>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>Ce projet sera accessible via l&apos;API publique de ton site</p>
            </div>
          </div>
        </div>
        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border)", display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <button className="genia-btn-ghost" onClick={onClose}>Annuler</button>
          <button className="genia-btn" onClick={() => handleSaveAndUpload(pendingFile || undefined)} disabled={saving || uploading}>
            {uploading ? "Upload en cours..." : saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Preview Modal ─────────────────────────────────────────────────────────
function PreviewModal({ item, onClose }: { item: PortfolioItem; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ maxWidth: "900px", width: "100%", padding: "1rem" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <div>
            <h2 style={{ margin: 0, color: "#fff", fontSize: "1.2rem", fontWeight: 700 }}>{item.title}</h2>
            {item.clientName && <p style={{ margin: "0.2rem 0 0", color: "#94a3b8", fontSize: "0.85rem" }}>Client : {item.clientName}</p>}
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: "6px", padding: "0.4rem 0.75rem", cursor: "pointer", fontSize: "1rem" }}>&times; Fermer</button>
        </div>
        {item.fileUrl && (
          item.type === "video"
            ? <video src={item.fileUrl} controls style={{ width: "100%", borderRadius: "10px", maxHeight: "65vh" }} />
            : <img src={item.fileUrl} alt={item.title} style={{ width: "100%", borderRadius: "10px", maxHeight: "65vh", objectFit: "contain" }} />
        )}
        {item.description && <p style={{ color: "#cbd5e1", fontSize: "0.88rem", marginTop: "0.75rem", lineHeight: 1.6 }}>{item.description}</p>}
        {item.tags && (
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" as const, marginTop: "0.5rem" }}>
            {item.tags.split(",").map(t => t.trim()).filter(Boolean).map(t => (
              <span key={t} style={{ padding: "0.2rem 0.6rem", borderRadius: "4px", background: "rgba(255,255,255,0.1)", color: "#cbd5e1", fontSize: "0.72rem" }}>{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Portfolio Card ───────────────────────────────────────────────────────
function PortfolioCard({ item, onEdit, onDelete, onTogglePublish, onPreview }: { item: PortfolioItem; onEdit: () => void; onDelete: () => void; onTogglePublish: () => void; onPreview: () => void }) {
  const isPublished = item.publishOnSite;
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
      {/* Thumbnail / preview */}
      <div
        onClick={item.fileUrl ? onPreview : undefined}
        style={{ height: "160px", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", cursor: item.fileUrl ? "pointer" : "default", position: "relative" as const, overflow: "hidden" }}
      >
        {item.fileUrl ? (
          item.type === "video"
            ? <video src={item.fileUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
            : <img src={item.fileUrl} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ textAlign: "center" as const, color: "var(--text-muted)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>🎬</div>
            <span style={{ fontSize: "0.78rem" }}>Aucun fichier</span>
          </div>
        )}
        {item.fileUrl && (
          <div style={{ position: "absolute" as const, inset: 0, background: "rgba(0,0,0,0)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "all 0.2s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(0,0,0,0.4)"; (e.currentTarget as HTMLDivElement).style.opacity = "1"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(0,0,0,0)"; (e.currentTarget as HTMLDivElement).style.opacity = "0"; }}
          >
            <span style={{ color: "#fff", fontSize: "2rem" }}>▶</span>
          </div>
        )}
        {isPublished && (
          <div style={{ position: "absolute" as const, top: "0.5rem", right: "0.5rem", background: "#22c55e", color: "#fff", borderRadius: "4px", padding: "0.2rem 0.5rem", fontSize: "0.65rem", fontWeight: 700 }}>SITE</div>
        )}
      </div>

      {/* Infos */}
      <div style={{ padding: "0.875rem 1rem" }}>
        <p style={{ margin: "0 0 0.2rem", fontWeight: 700, fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{item.title}</p>
        {item.clientName && <p style={{ margin: "0 0 0.35rem", fontSize: "0.75rem", color: "#f97316", fontWeight: 600 }}>• {item.clientName}</p>}
        {item.description && <p style={{ margin: "0 0 0.5rem", fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>{item.description}</p>}
        {item.tags && (
          <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" as const, marginBottom: "0.5rem" }}>
            {item.tags.split(",").map(t => t.trim()).filter(Boolean).slice(0, 4).map(t => (
              <span key={t} style={{ padding: "0.1rem 0.4rem", borderRadius: "4px", background: "var(--bg)", fontSize: "0.65rem", color: "var(--text-muted)", border: "1px solid var(--border)" }}>{t}</span>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" as const }}>
          <button onClick={onTogglePublish} style={{ flex: 1, padding: "0.3rem 0.5rem", borderRadius: "6px", border: "1px solid " + (isPublished ? "#22c55e" : "var(--border)"), background: isPublished ? "#22c55e22" : "transparent", color: isPublished ? "#22c55e" : "var(--text-muted)", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600 }}>
            {isPublished ? "✓ Sur le site" : "Publier site"}
          </button>
          <button onClick={onEdit} className="genia-btn-ghost" style={{ padding: "0.3rem 0.6rem", fontSize: "0.72rem" }}>Editer</button>
          <button onClick={onDelete} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1rem", padding: "0.3rem 0.4rem" }}>&times;</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────
export default function PortfolioClient() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<PortfolioItem> | null>(null);
  const [previewing, setPreviewing] = useState<PortfolioItem | null>(null);
  const [filterTag, setFilterTag] = useState("all");

  const fetchAll = useCallback(async () => {
    const [ir, cr] = await Promise.all([fetch("/api/portfolio"), fetch("/api/crm")]);
    if (ir.ok) setItems(await ir.json());
    if (cr.ok) { const d = await cr.json(); setClients(d.map((c: Client) => ({ id: c.id, name: c.name }))); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleSave(data: Partial<PortfolioItem>): Promise<string> {
    if (form?.id) {
      await fetch("/api/portfolio/" + form.id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      setForm(null);
      fetchAll();
      return form.id;
    } else {
      const res = await fetch("/api/portfolio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const created = await res.json();
      setForm(null);
      fetchAll();
      return created.id;
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce projet du portfolio ?")) return;
    await fetch("/api/portfolio/" + id, { method: "DELETE" });
    fetchAll();
  }

  async function handleTogglePublish(item: PortfolioItem) {
    await fetch("/api/portfolio/" + item.id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publishOnSite: !item.publishOnSite }) });
    fetchAll();
  }

  // Tous les tags uniques
  const allTags = Array.from(new Set(items.flatMap(i => i.tags.split(",").map(t => t.trim()).filter(Boolean))));
  const filtered = filterTag === "all" ? items : items.filter(i => i.tags.split(",").map(t => t.trim()).includes(filterTag));
  const publishedCount = items.filter(i => i.publishOnSite).length;

  const publicUrl = typeof window !== "undefined" ? window.location.origin + "/api/public/portfolio" : "/api/public/portfolio";

  if (loading) return <div style={{ padding: "2rem", color: "var(--text-muted)" }}>Chargement...</div>;

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1100px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.375rem", fontWeight: 700, margin: 0 }}>Portfolio</h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.25rem 0 0" }}>Tes creations · {items.length} projets · {publishedCount} publies sur le site</p>
        </div>
        <button className="genia-btn" onClick={() => setForm({ publishOnSite: false })}>+ Ajouter un projet</button>
      </div>

      {/* API publique info */}
      {publishedCount > 0 && (
        <div style={{ background: "#22c55e11", border: "1px solid #22c55e44", borderRadius: "8px", padding: "0.75rem 1rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "0.85rem", color: "#16a34a", fontWeight: 600 }}>🌐 {publishedCount} projet(s) publie(s) sur ton site</span>
          <code style={{ fontSize: "0.72rem", background: "rgba(0,0,0,0.05)", padding: "0.2rem 0.5rem", borderRadius: "4px", color: "#374151", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{publicUrl}</code>
          <button onClick={() => navigator.clipboard.writeText(publicUrl)} className="genia-btn-ghost" style={{ fontSize: "0.72rem", padding: "0.2rem 0.6rem", flexShrink: 0 }}>Copier</button>
        </div>
      )}

      {/* Filtres tags */}
      {allTags.length > 0 && (
        <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" as const, marginBottom: "1.25rem" }}>
          <button onClick={() => setFilterTag("all")} style={{ padding: "0.3rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border)", background: filterTag === "all" ? "var(--accent)" : "transparent", color: filterTag === "all" ? "#fff" : "var(--text-muted)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>Tous ({items.length})</button>
          {allTags.map(t => (
            <button key={t} onClick={() => setFilterTag(t)} style={{ padding: "0.3rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border)", background: filterTag === t ? "var(--accent)" : "transparent", color: filterTag === t ? "#fff" : "var(--text-muted)", cursor: "pointer", fontSize: "0.78rem" }}>{t}</button>
          ))}
        </div>
      )}

      {/* Grille */}
      {filtered.length === 0 ? (
        <div style={{ padding: "4rem", textAlign: "center" as const, color: "var(--text-muted)", background: "var(--surface)", border: "2px dashed var(--border)", borderRadius: "12px" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🎬</div>
          <p style={{ margin: 0, fontWeight: 600 }}>Aucun projet pour l&apos;instant</p>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem" }}>Ajoute tes premieres creations</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: "1rem" }}>
          {filtered.map(item => (
            <PortfolioCard key={item.id} item={item} onEdit={() => setForm(item)} onDelete={() => handleDelete(item.id)} onTogglePublish={() => handleTogglePublish(item)} onPreview={() => setPreviewing(item)} />
          ))}
        </div>
      )}

      {form !== null && <ItemForm initial={form} clients={clients} onSave={handleSave} onClose={() => setForm(null)} />}
      {previewing && <PreviewModal item={previewing} onClose={() => setPreviewing(null)} />}
    </div>
  );
}
