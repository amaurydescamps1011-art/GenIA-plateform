"use client";
import { CSSProperties, useState, useCallback, useEffect } from "react";

type Post = {
  id: string;
  title: string;
  type: string;
  platform: string;
  status: string;
  scheduledAt: string;
  publishedAt: string;
  notes: string;
  clientId: string;
  clientName: string;
  createdAt: string;
};

const PLATFORMS: Record<string, { label: string; color: string; icon: string }> = {
  instagram: { label: "Instagram", color: "#e1306c", icon: "IG" },
  tiktok:    { label: "TikTok",    color: "#010101", icon: "TK" },
  youtube:   { label: "YouTube",   color: "#ff0000", icon: "YT" },
  linkedin:  { label: "LinkedIn",  color: "#0077b5", icon: "LI" },
  all:       { label: "Tous",      color: "#8b5cf6", icon: "✦"  },
};

const STATUSES: Record<string, { label: string; color: string }> = {
  idee:     { label: "Idee",          color: "#94a3b8" },
  en_cours: { label: "En cours",      color: "#f97316" },
  pret:     { label: "Pret a poster", color: "#6366f1" },
  publie:   { label: "Publie",        color: "#22c55e" },
};

const POST_TYPES: Record<string, { label: string; color: string }> = {
  client_project: { label: "Projet client", color: "#f97316" },
  inspiration:    { label: "Inspiration",   color: "#8b5cf6" },
  contenu:        { label: "Contenu",       color: "#6366f1" },
};

function today() { return new Date().toISOString().split("T")[0]; }

// ─── Post Form ────────────────────────────────────────────────────────────
function PostForm({ initial, onSave, onClose }: { initial: Partial<Post>; onSave: (p: Partial<Post>) => Promise<void>; onClose: () => void }) {
  const [form, setForm] = useState<Partial<Post>>(initial);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof Post>(k: K, v: Post[K]) { setForm(f => ({ ...f, [k]: v })); }

  async function submit() {
    if (!form.title?.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  const lbl: CSSProperties = { fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: "var(--surface)", borderRadius: "14px", width: "100%", maxWidth: "540px", border: "1px solid var(--border)", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>{initial.id ? "Modifier" : "Nouveau"} post</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.3rem" }}>&times;</button>
        </div>
        <div style={{ padding: "1.25rem 1.5rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div>
            <label style={lbl}>Titre / Idee *</label>
            <input className="genia-input" style={{ width: "100%" }} value={form.title || ""} onChange={e => set("title", e.target.value)} placeholder="Ex: Before/after montage client, tuto IA..." autoFocus />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={lbl}>Type</label>
              <select className="genia-input" style={{ width: "100%", background: "var(--surface)", color: "var(--text)" }} value={form.type || "contenu"} onChange={e => set("type", e.target.value)}>
                {Object.entries(POST_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Plateforme</label>
              <select className="genia-input" style={{ width: "100%", background: "var(--surface)", color: "var(--text)" }} value={form.platform || "all"} onChange={e => set("platform", e.target.value)}>
                {Object.entries(PLATFORMS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={lbl}>Statut</label>
              <select className="genia-input" style={{ width: "100%", background: "var(--surface)", color: "var(--text)" }} value={form.status || "idee"} onChange={e => set("status", e.target.value)}>
                {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Date programmee</label>
              <input className="genia-input" style={{ width: "100%" }} type="date" value={form.scheduledAt || ""} onChange={e => set("scheduledAt", e.target.value)} />
            </div>
          </div>
          <div>
            <label style={lbl}>Notes / script</label>
            <textarea className="genia-input" style={{ width: "100%", height: "90px", resize: "vertical" }} value={form.notes || ""} onChange={e => set("notes", e.target.value)} placeholder="Idees de contenu, hook, CTA..." />
          </div>
        </div>
        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border)", display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <button className="genia-btn-ghost" onClick={onClose}>Annuler</button>
          <button className="genia-btn" onClick={submit} disabled={saving}>{saving ? "..." : "Enregistrer"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────
function PostCard({ post, onEdit, onDelete, onPublish }: { post: Post; onEdit: () => void; onDelete: () => void; onPublish: () => void }) {
  const plat = PLATFORMS[post.platform] || PLATFORMS.all;
  const stat = STATUSES[post.status] || STATUSES.idee;
  const typ = POST_TYPES[post.type] || POST_TYPES.contenu;
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "0.75rem 1rem", display: "flex", alignItems: "flex-start", gap: "0.75rem", borderLeft: "4px solid " + plat.color }}>
      <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: plat.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
        {plat.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" as const, marginBottom: "0.2rem" }}>
          <span style={{ fontWeight: 600, fontSize: "0.88rem" }}>{post.title}</span>
          {post.clientName && <span style={{ fontSize: "0.7rem", color: "#f97316", fontWeight: 600 }}>• {post.clientName}</span>}
        </div>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" as const }}>
          <span style={{ padding: "0.1rem 0.45rem", borderRadius: "4px", background: stat.color + "22", color: stat.color, fontSize: "0.7rem", fontWeight: 600 }}>{stat.label}</span>
          <span style={{ padding: "0.1rem 0.45rem", borderRadius: "4px", background: typ.color + "22", color: typ.color, fontSize: "0.7rem", fontWeight: 600 }}>{typ.label}</span>
          {post.scheduledAt && <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>📅 {new Date(post.scheduledAt).toLocaleDateString("fr-FR")}</span>}
        </div>
        {post.notes && <p style={{ margin: "0.3rem 0 0", fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.4 }}>{post.notes.slice(0, 100)}{post.notes.length > 100 ? "..." : ""}</p>}
      </div>
      <div style={{ display: "flex", gap: "0.25rem", flexShrink: 0 }}>
        {post.status !== "publie" && (
          <button onClick={onPublish} className="genia-btn" style={{ fontSize: "0.72rem", padding: "0.25rem 0.5rem", background: "#22c55e", borderColor: "#22c55e" }}>✓ Publie</button>
        )}
        <button onClick={onEdit} className="genia-btn-ghost" style={{ fontSize: "0.72rem", padding: "0.25rem 0.5rem" }}>Editer</button>
        <button onClick={onDelete} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1rem" }}>&times;</button>
      </div>
    </div>
  );
}

// ─── Calendar ─────────────────────────────────────────────────────────────
function CalendarView({ posts, onDayClick, onEdit, onDelete, onPublish }: {
  posts: Post[];
  onDayClick: (date: string) => void;
  onEdit: (p: Post) => void;
  onDelete: (id: string) => void;
  onPublish: (p: Post) => void;
}) {
  const [cur, setCur] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [selected, setSelected] = useState<string | null>(null);

  const firstDay = new Date(cur.y, cur.m, 1);
  const lastDay = new Date(cur.y, cur.m + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // lundi = 0
  const daysInMonth = lastDay.getDate();
  const todayStr = today();

  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = firstDay.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  function dateStr(day: number) {
    return cur.y + "-" + String(cur.m + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");
  }

  const selectedPosts = selected ? posts.filter(p => p.scheduledAt === selected) : [];

  return (
    <div>
      {/* Nav mois */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
        <button className="genia-btn-ghost" style={{ padding: "0.3rem 0.75rem" }} onClick={() => setCur(c => { const d = new Date(c.y, c.m - 1, 1); return { y: d.getFullYear(), m: d.getMonth() }; })}>‹</button>
        <span style={{ fontWeight: 700, fontSize: "1rem", minWidth: "160px", textAlign: "center" as const, textTransform: "capitalize" as const }}>{monthLabel}</span>
        <button className="genia-btn-ghost" style={{ padding: "0.3rem 0.75rem" }} onClick={() => setCur(c => { const d = new Date(c.y, c.m + 1, 1); return { y: d.getFullYear(), m: d.getMonth() }; })}>›</button>
        <button className="genia-btn-ghost" style={{ fontSize: "0.78rem", marginLeft: "auto" }} onClick={() => { const d = new Date(); setCur({ y: d.getFullYear(), m: d.getMonth() }); }}>Aujourd&apos;hui</button>
      </div>

      {/* Grille */}
      <div style={{ border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
        {/* En-têtes jours */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", background: "var(--surface)" }}>
          {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map(d => (
            <div key={d} style={{ padding: "0.5rem 0", textAlign: "center" as const, fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" as const }}>{d}</div>
          ))}
        </div>

        {/* Cellules */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} style={{ minHeight: "80px", background: "var(--bg)", borderTop: "1px solid var(--border)", borderRight: i % 7 !== 6 ? "1px solid var(--border)" : "none" }} />;
            const ds = dateStr(day);
            const dayPosts = posts.filter(p => p.scheduledAt === ds);
            const isToday = ds === todayStr;
            const isSelected = ds === selected;
            return (
              <div
                key={i}
                onClick={() => { setSelected(isSelected ? null : ds); if (!isSelected) onDayClick(ds); }}
                style={{
                  minHeight: "80px", padding: "0.375rem 0.5rem", borderTop: "1px solid var(--border)",
                  borderRight: i % 7 !== 6 ? "1px solid var(--border)" : "none",
                  background: isSelected ? "var(--accent)11" : isToday ? "var(--surface)" : "var(--bg)",
                  cursor: "pointer", position: "relative" as const,
                  outline: isToday ? "2px solid var(--accent)" : "none", outlineOffset: "-2px",
                }}
              >
                <span style={{ fontSize: "0.78rem", fontWeight: isToday ? 700 : 400, color: isToday ? "var(--accent)" : "var(--text)" }}>{day}</span>
                <div style={{ marginTop: "0.25rem", display: "flex", flexDirection: "column" as const, gap: "2px" }}>
                  {dayPosts.slice(0, 3).map(p => {
                    const plat = PLATFORMS[p.platform] || PLATFORMS.all;
                    const stat = STATUSES[p.status] || STATUSES.idee;
                    return (
                      <div key={p.id} style={{ fontSize: "0.65rem", padding: "1px 4px", borderRadius: "3px", background: plat.color, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, opacity: p.status === "publie" ? 0.5 : 1 }}>
                        {plat.icon} {p.title}
                      </div>
                    );
                  })}
                  {dayPosts.length > 3 && <span style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>+{dayPosts.length - 3}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Panel jour sélectionné */}
      {selected && (
        <div style={{ marginTop: "1rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem" }}>{new Date(selected).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</p>
            <button className="genia-btn" style={{ fontSize: "0.78rem" }} onClick={() => onDayClick(selected)}>+ Ajouter ce jour</button>
          </div>
          {selectedPosts.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>Aucun post programme ce jour.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.5rem" }}>
              {selectedPosts.map(p => <PostCard key={p.id} post={p} onEdit={() => onEdit(p)} onDelete={() => onDelete(p.id)} onPublish={() => onPublish(p)} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────
export default function SocialClient() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"calendar" | "ideas" | "published">("calendar");
  const [form, setForm] = useState<Partial<Post> | null>(null);

  const fetchAll = useCallback(async () => {
    const res = await fetch("/api/social");
    if (res.ok) setPosts(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleSave(data: Partial<Post>) {
    if (form?.id) {
      await fetch("/api/social/" + form.id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    } else {
      await fetch("/api/social", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    }
    setForm(null);
    fetchAll();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce post ?")) return;
    await fetch("/api/social/" + id, { method: "DELETE" });
    fetchAll();
  }

  async function handlePublish(post: Post) {
    await fetch("/api/social/" + post.id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "publie", publishedAt: today() }) });
    fetchAll();
  }

  const ideas = posts.filter(p => !p.scheduledAt && p.status !== "publie");
  const published = posts.filter(p => p.status === "publie");
  const scheduled = posts.filter(p => p.scheduledAt && p.status !== "publie");

  // Stats
  const postsThisMonth = posts.filter(p => {
    const d = new Date(); const pDate = new Date(p.publishedAt || p.scheduledAt || "");
    return pDate.getFullYear() === d.getFullYear() && pDate.getMonth() === d.getMonth();
  }).length;

  if (loading) return <div style={{ padding: "2rem", color: "var(--text-muted)" }}>Chargement...</div>;

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1000px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.375rem", fontWeight: 700, margin: 0 }}>Social Media</h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.25rem 0 0" }}>Calendrier editorial & inspirations</p>
        </div>
        <button className="genia-btn" onClick={() => setForm({ type: "contenu", platform: "all", status: "idee" })}>+ Nouveau post</button>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Idees", val: ideas.length, color: "#94a3b8" },
          { label: "Programmes", val: scheduled.length, color: "#6366f1" },
          { label: "Publies", val: published.length, color: "#22c55e" },
          { label: "Ce mois", val: postsThisMonth, color: "#f97316" },
        ].map(k => (
          <div key={k.label} className="genia-card" style={{ padding: "0.875rem 1rem", borderLeft: "4px solid " + k.color }}>
            <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", color: k.color }}>{k.label}</p>
            <p style={{ margin: "0.2rem 0 0", fontSize: "1.5rem", fontWeight: 700 }}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.25rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
        {([["calendar", "Calendrier"], ["ideas", "Idees & inspirations (" + ideas.length + ")"], ["published", "Publies (" + published.length + ")"]] as const).map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "0.4rem 1rem", borderRadius: "6px", border: "none", background: tab === t ? "var(--accent)" : "transparent", color: tab === t ? "#fff" : "var(--text-muted)", cursor: "pointer", fontWeight: 600, fontSize: "0.82rem" }}>{l}</button>
        ))}
      </div>

      {/* Calendrier */}
      {tab === "calendar" && (
        <CalendarView
          posts={posts.filter(p => p.scheduledAt)}
          onDayClick={date => setForm({ type: "contenu", platform: "all", status: "idee", scheduledAt: date })}
          onEdit={p => setForm(p)}
          onDelete={handleDelete}
          onPublish={handlePublish}
        />
      )}

      {/* Idees */}
      {tab === "ideas" && (
        <div>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" as const }}>
            {Object.entries(POST_TYPES).map(([k, v]) => {
              const n = ideas.filter(p => p.type === k).length;
              return n > 0 ? <span key={k} style={{ padding: "0.2rem 0.6rem", borderRadius: "4px", background: v.color + "22", color: v.color, fontSize: "0.75rem", fontWeight: 600 }}>{v.label} ({n})</span> : null;
            })}
          </div>
          {ideas.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center" as const, color: "var(--text-muted)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px" }}>
              Aucune idee pour l&apos;instant — ajoute des inspirations !
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.5rem" }}>
              {ideas.map(p => <PostCard key={p.id} post={p} onEdit={() => setForm(p)} onDelete={() => handleDelete(p.id)} onPublish={() => handlePublish(p)} />)}
            </div>
          )}
        </div>
      )}

      {/* Publies */}
      {tab === "published" && (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.5rem" }}>
          {published.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center" as const, color: "var(--text-muted)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px" }}>
              Aucun post publie encore.
            </div>
          ) : published.map(p => <PostCard key={p.id} post={p} onEdit={() => setForm(p)} onDelete={() => handleDelete(p.id)} onPublish={() => handlePublish(p)} />)}
        </div>
      )}

      {form !== null && (
        <PostForm
          initial={form}
          onSave={handleSave}
          onClose={() => setForm(null)}
        />
      )}
    </div>
  );
}
