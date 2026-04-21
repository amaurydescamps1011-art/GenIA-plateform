"use client";
import { CSSProperties, useState, useEffect, useRef } from "react";

type Invoice = { id: string; type: string; number: string; status: string; total: number; issueDate: string };
type Todo = { id: string; title: string; done: boolean; createdAt: string };
type PortfolioItem = { id: string; title: string; fileUrl: string; type: string; publishOnSite: boolean };
type SocialPost = { id: string; title: string; platform: string; status: string; scheduledAt: string };
type MediaAsset = { id: string; name: string; category: string; url: string; mimeType: string; fileType: string; createdAt: string };
type Client = {
  id: string; name: string; status: string; budget: number | null;
  email: string; phone: string; address: string; siret: string;
  notes: string; tags: string; contact: string; driveUrl: string; createdAt: string;
};
type Profile = { client: Client; invoices: Invoice[]; todos: Todo[]; portfolio: PortfolioItem[]; socialPosts: SocialPost[]; assets: MediaAsset[] };

const STATUS_LABELS: Record<string, string> = { prospect: "Prospect", verbal: "Verbal", acompte: "Acompte", en_cours: "En cours", termine: "Terminé", followup: "Follow-up", perdu: "Perdu" };
const STATUS_COLORS: Record<string, string> = { prospect: "#eab308", verbal: "#f97316", acompte: "#22c55e", en_cours: "#6366f1", termine: "#16a34a", followup: "#8b5cf6", perdu: "#ef4444" };
const INV_COLORS: Record<string, string> = { devis: "#6366f1", acompte: "#f97316", facture: "#22c55e" };
const PLAT_COLORS: Record<string, string> = { instagram: "#e1306c", tiktok: "#010101", youtube: "#ff0000", linkedin: "#0077b5", all: "#8b5cf6" };

const MEDIA_CATS = [
  { key: "logo", label: "Logo", icon: "🎨" },
  { key: "avatar", label: "Avatar / Photo", icon: "👤" },
  { key: "charte", label: "Charte graphique", icon: "🖌️" },
  { key: "produit", label: "Produit", icon: "📦" },
  { key: "autre", label: "Autre", icon: "📄" },
];

function fmt(n: number) { return n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " €"; }
function fmtDate(s: string) { return s ? new Date(s).toLocaleDateString("fr-FR") : ""; }

const TABS = ["infos", "projets", "factures", "taches", "social", "medias"] as const;
type Tab = typeof TABS[number];
const TAB_LABELS: Record<Tab, string> = { infos: "Infos", projets: "Portfolio", factures: "Factures", taches: "Tâches", social: "Social", medias: "Médias" };

// ──────────────────────────────────────────────
// Médias tab
// ──────────────────────────────────────────────
function MediasTab({ clientId, initial }: { clientId: string; initial: MediaAsset[] }) {
  const [assets, setAssets] = useState<MediaAsset[]>(initial);
  const [cat, setCat] = useState("logo");
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);

  async function upload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("name", file.name.replace(/\.[^.]+$/, ""));
    fd.append("category", cat);
    fd.append("clientId", clientId);
    const res = await fetch("/api/assets", { method: "POST", body: fd });
    if (res.ok) {
      const a = await res.json();
      setAssets((prev) => [a, ...prev]);
    }
    setUploading(false);
  }

  async function deleteAsset(id: string) {
    await fetch("/api/assets/" + id, { method: "DELETE" });
    setAssets((prev) => prev.filter((a) => a.id !== id));
  }

  const displayed = filter ? assets.filter((a) => a.category === filter) : assets;

  return (
    <div>
      {/* Upload zone */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem" }}>
        <p style={{ margin: "0 0 0.875rem", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Ajouter un média</p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.875rem" }}>
          {MEDIA_CATS.map((c) => (
            <button
              key={c.key}
              onClick={() => setCat(c.key)}
              style={{
                padding: "0.35rem 0.875rem", borderRadius: "6px", fontSize: "0.8rem", cursor: "pointer",
                border: "1px solid " + (cat === c.key ? "var(--accent)" : "var(--border)"),
                background: cat === c.key ? "var(--accent-dim)" : "transparent",
                color: cat === c.key ? "var(--accent)" : "var(--text-muted)",
                fontWeight: cat === c.key ? 600 : 400,
              }}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>
        <label style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", cursor: uploading ? "wait" : "pointer", padding: "0.6rem 1.25rem", borderRadius: "8px", border: "1px dashed var(--border)", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          {uploading ? "Upload en cours..." : "+ Choisir un fichier"}
          <input type="file" accept="image/*,application/pdf,video/*" style={{ display: "none" }} disabled={uploading}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
        </label>
      </div>

      {/* Filter bar */}
      {assets.length > 0 && (
        <div style={{ display: "flex", gap: "0.375rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <button onClick={() => setFilter(null)} style={{ padding: "0.25rem 0.75rem", borderRadius: "999px", fontSize: "0.78rem", cursor: "pointer", border: "1px solid " + (!filter ? "var(--accent)" : "var(--border)"), background: !filter ? "var(--accent-dim)" : "transparent", color: !filter ? "var(--accent)" : "var(--text-muted)" }}>Tout</button>
          {MEDIA_CATS.filter(c => assets.some(a => a.category === c.key)).map(c => (
            <button key={c.key} onClick={() => setFilter(c.key === filter ? null : c.key)} style={{ padding: "0.25rem 0.75rem", borderRadius: "999px", fontSize: "0.78rem", cursor: "pointer", border: "1px solid " + (filter === c.key ? "var(--accent)" : "var(--border)"), background: filter === c.key ? "var(--accent-dim)" : "transparent", color: filter === c.key ? "var(--accent)" : "var(--text-muted)" }}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {displayed.length === 0 ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px" }}>
          Aucun média. Uploade le logo, la charte, des photos produit...
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.875rem" }}>
          {displayed.map((a) => {
            const catInfo = MEDIA_CATS.find(c => c.key === a.category);
            const isImage = a.fileType === "image";
            return (
              <div key={a.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden", position: "relative" }}>
                <div style={{ height: "110px", background: "var(--bg)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {isImage
                    ? <img src={a.url} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    : <span style={{ fontSize: "2.5rem" }}>{catInfo?.icon || "📄"}</span>
                  }
                </div>
                <div style={{ padding: "0.5rem 0.625rem" }}>
                  <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.25rem" }}>
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{catInfo?.label || a.category}</span>
                    <div style={{ display: "flex", gap: "0.25rem" }}>
                      <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.65rem", color: "var(--accent)", textDecoration: "none" }}>↗</a>
                      <button onClick={() => deleteAsset(a.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#ef4444", fontSize: "0.7rem", padding: 0, lineHeight: 1 }}>×</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────
export default function ClientProfile({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tab, setTab] = useState<Tab>("infos");

  useEffect(() => {
    fetch("/api/crm/" + clientId + "/profile").then(r => r.ok ? r.json() : null).then(d => { if (d) setProfile(d); });
  }, [clientId]);

  if (!profile) return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "var(--surface)", borderRadius: "14px", padding: "2rem 3rem", color: "var(--text-muted)" }}>Chargement...</div>
    </div>
  );

  const { client, invoices, todos, portfolio, socialPosts, assets } = profile;
  const totalFacture = invoices.filter(i => ["acompte", "facture"].includes(i.type)).reduce((s, i) => s + i.total, 0);
  const totalPaye = invoices.filter(i => i.status === "paye").reduce((s, i) => s + i.total, 0);
  const sColor = STATUS_COLORS[client.status] || "#888";

  const lbl: CSSProperties = { fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.2rem" };
  const val: CSSProperties = { fontSize: "0.9rem", margin: 0, color: "var(--text)" };

  return (
    <div style={{ position: "fixed", left: "220px", top: 0, right: 0, bottom: 0, background: "var(--bg)", zIndex: 100, overflowY: "auto", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "1.25rem 2rem", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.4rem", lineHeight: 1, padding: "0.1rem 0.4rem" }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>{client.name}</h1>
            <span style={{ padding: "0.2rem 0.6rem", borderRadius: "6px", background: sColor + "22", color: sColor, fontSize: "0.75rem", fontWeight: 600 }}>{STATUS_LABELS[client.status] || client.status}</span>
          </div>
          <div style={{ display: "flex", gap: "1.25rem", marginTop: "0.3rem" }}>
            {client.email && <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{client.email}</span>}
            {client.phone && <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{client.phone}</span>}
            {client.budget && <span style={{ fontSize: "0.8rem", color: "#22c55e", fontWeight: 600 }}>Budget : {fmt(client.budget)}</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: "1.5rem", flexShrink: 0 }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Facturé</p>
            <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#6366f1" }}>{fmt(totalFacture)}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Payé</p>
            <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#22c55e" }}>{fmt(totalPaye)}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: "0 2rem", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", gap: "0.25rem", flexShrink: 0 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "0.6rem 1rem", border: "none", background: "transparent", cursor: "pointer", fontWeight: 600, fontSize: "0.82rem", color: tab === t ? "var(--accent)" : "var(--text-muted)", borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent", marginBottom: "-1px", whiteSpace: "nowrap" }}>
            {TAB_LABELS[t]}
            {t === "factures" && invoices.length ? <span style={{ fontSize: "0.7rem" }}> ({invoices.length})</span> : null}
            {t === "taches" && todos.length ? <span style={{ fontSize: "0.7rem" }}> ({todos.length})</span> : null}
            {t === "medias" && assets.length ? <span style={{ fontSize: "0.7rem" }}> ({assets.length})</span> : null}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "1.5rem 2rem", maxWidth: "960px" }}>

        {/* INFOS */}
        {tab === "infos" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div className="genia-card" style={{ padding: "1.25rem" }}>
              <h3 style={{ margin: "0 0 1rem", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>Coordonnées</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {client.email && <div><span style={lbl}>Email</span><p style={val}>{client.email}</p></div>}
                {client.phone && <div><span style={lbl}>Téléphone</span><p style={val}>{client.phone}</p></div>}
                {client.address && <div><span style={lbl}>Adresse</span><p style={{ ...val, whiteSpace: "pre-wrap" }}>{client.address}</p></div>}
                {client.siret && <div><span style={lbl}>SIRET</span><p style={val}>{client.siret}</p></div>}
                {client.contact && <div><span style={lbl}>Contact</span><p style={val}>{client.contact}</p></div>}
                {client.driveUrl && <div><span style={lbl}>Google Drive</span><a href={client.driveUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.85rem", color: "var(--accent)" }}>Ouvrir le dossier →</a></div>}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="genia-card" style={{ padding: "1.25rem" }}>
                <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>Projet</h3>
                {client.budget && <div style={{ marginBottom: "0.5rem" }}><span style={lbl}>Budget</span><p style={{ ...val, color: "#22c55e", fontWeight: 700 }}>{fmt(client.budget)}</p></div>}
                {client.tags && <div><span style={lbl}>Tags</span><div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", marginTop: "0.3rem" }}>{client.tags.split(",").map(t => t.trim()).filter(Boolean).map(t => <span key={t} style={{ padding: "0.1rem 0.5rem", borderRadius: "4px", background: "var(--bg)", fontSize: "0.72rem", border: "1px solid var(--border)" }}>{t}</span>)}</div></div>}
              </div>
              {client.notes && (
                <div className="genia-card" style={{ padding: "1.25rem" }}>
                  <span style={lbl}>Notes</span>
                  <p style={{ ...val, whiteSpace: "pre-wrap", lineHeight: 1.6, marginTop: "0.3rem" }}>{client.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PORTFOLIO */}
        {tab === "projets" && (
          <div>
            {portfolio.length === 0 ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px" }}>Aucun projet dans le portfolio pour ce client.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
                {portfolio.map(p => (
                  <a key={p.id} href={p.fileUrl || "#"} target={p.fileUrl ? "_blank" : "_self"} rel="noopener noreferrer" style={{ textDecoration: "none", display: "block", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
                    <div style={{ height: "130px", background: "var(--bg)", overflow: "hidden" }}>
                      {p.fileUrl
                        ? p.type === "video"
                          ? <video src={p.fileUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
                          : <img src={p.fileUrl} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>🎬</div>}
                    </div>
                    <div style={{ padding: "0.625rem 0.75rem" }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: "0.85rem", color: "var(--text)" }}>{p.title}</p>
                      {p.publishOnSite && <span style={{ fontSize: "0.65rem", background: "#22c55e22", color: "#16a34a", padding: "0.1rem 0.4rem", borderRadius: "3px", fontWeight: 600 }}>SITE</span>}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FACTURES */}
        {tab === "factures" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {invoices.length === 0 ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px" }}>Aucune facture pour ce client.</div>
            ) : invoices.map(inv => {
              const c = INV_COLORS[inv.type] || "#888";
              return (
                <div key={inv.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: "4px", height: "36px", borderRadius: "2px", background: c, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 700, fontSize: "0.88rem" }}>{inv.number}</span>
                    <span style={{ marginLeft: "0.5rem", fontSize: "0.72rem", color: "var(--text-muted)" }}>{fmtDate(inv.issueDate)}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: c }}>{fmt(inv.total)}</span>
                  <span style={{ padding: "0.15rem 0.5rem", borderRadius: "4px", background: inv.status === "paye" ? "#22c55e22" : "var(--bg)", color: inv.status === "paye" ? "#16a34a" : "var(--text-muted)", fontSize: "0.72rem", fontWeight: 600 }}>{inv.status}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* TACHES */}
        {tab === "taches" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            {todos.length === 0 ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px" }}>Aucune tâche pour ce client.</div>
            ) : todos.map(t => (
              <div key={t.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "0.625rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem", opacity: t.done ? 0.5 : 1 }}>
                <span style={{ width: "14px", height: "14px", borderRadius: "50%", border: t.done ? "2px solid #22c55e" : "2px solid var(--border)", background: t.done ? "#22c55e" : "transparent", flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: "0.88rem", textDecoration: t.done ? "line-through" : "none" }}>{t.title}</span>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{fmtDate(t.createdAt)}</span>
              </div>
            ))}
          </div>
        )}

        {/* SOCIAL */}
        {tab === "social" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            {socialPosts.length === 0 ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px" }}>Aucun post social pour ce client.</div>
            ) : socialPosts.map(p => {
              const pc = PLAT_COLORS[p.platform] || "#888";
              return (
                <div key={p.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "0.625rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: pc, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: "0.88rem" }}>{p.title}</span>
                  {p.scheduledAt && <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{fmtDate(p.scheduledAt)}</span>}
                  <span style={{ padding: "0.15rem 0.5rem", borderRadius: "4px", background: "var(--bg)", fontSize: "0.72rem", color: p.status === "publie" ? "#22c55e" : "var(--text-muted)", fontWeight: 600 }}>{p.status}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* MÉDIAS */}
        {tab === "medias" && (
          <MediasTab clientId={clientId} initial={assets} />
        )}

      </div>
    </div>
  );
}
