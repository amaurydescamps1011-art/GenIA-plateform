"use client";
import { CSSProperties, useState, useEffect } from "react";

type Invoice = { id: string; type: string; number: string; status: string; total: number; issueDate: string };
type Todo = { id: string; title: string; done: boolean; createdAt: string };
type PortfolioItem = { id: string; title: string; fileUrl: string; type: string; publishOnSite: boolean };
type SocialPost = { id: string; title: string; platform: string; status: string; scheduledAt: string };
type Client = {
  id: string; name: string; status: string; budget: number | null;
  email: string; phone: string; address: string; siret: string;
  notes: string; tags: string; contact: string; driveUrl: string;
  createdAt: string;
};
type Profile = { client: Client; invoices: Invoice[]; todos: Todo[]; portfolio: PortfolioItem[]; socialPosts: SocialPost[] };

const STATUS_LABELS: Record<string,string> = { prospect:"Prospect", verbal:"Verbal", acompte:"Acompte", en_cours:"En cours", termine:"Termine", followup:"Follow-up", perdu:"Perdu" };
const STATUS_COLORS: Record<string,string> = { prospect:"#eab308", verbal:"#f97316", acompte:"#22c55e", en_cours:"#6366f1", termine:"#16a34a", followup:"#8b5cf6", perdu:"#ef4444" };
const INV_COLORS: Record<string,string> = { devis:"#6366f1", acompte:"#f97316", facture:"#22c55e" };
const PLAT_COLORS: Record<string,string> = { instagram:"#e1306c", tiktok:"#010101", youtube:"#ff0000", linkedin:"#0077b5", all:"#8b5cf6" };

function fmt(n: number) { return n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " €"; }
function fmtDate(s: string) { return s ? new Date(s).toLocaleDateString("fr-FR") : ""; }

const TABS = ["infos","projets","factures","taches","social"] as const;
type Tab = typeof TABS[number];
const TAB_LABELS: Record<Tab,string> = { infos:"Infos", projets:"Portfolio", factures:"Factures", taches:"Taches", social:"Social" };

export default function ClientProfile({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tab, setTab] = useState<Tab>("infos");

  useEffect(() => {
    fetch("/api/crm/" + clientId + "/profile").then(r => r.ok ? r.json() : null).then(d => { if (d) setProfile(d); });
  }, [clientId]);

  if (!profile) return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"var(--surface)", borderRadius:"14px", padding:"2rem 3rem", color:"var(--text-muted)" }}>Chargement...</div>
    </div>
  );

  const { client, invoices, todos, portfolio, socialPosts } = profile;
  const totalFacture = invoices.filter(i => ["acompte","facture"].includes(i.type)).reduce((s,i) => s + i.total, 0);
  const totalPaye = invoices.filter(i => i.status === "paye").reduce((s,i) => s + i.total, 0);
  const sColor = STATUS_COLORS[client.status] || "#888";

  const lbl: CSSProperties = { fontSize:"0.72rem", fontWeight:600, color:"var(--text-muted)", textTransform:"uppercase" as const, letterSpacing:"0.05em", display:"block", marginBottom:"0.2rem" };
  const val: CSSProperties = { fontSize:"0.9rem", margin:0, color:"var(--text)" };

  return (
    <div style={{ position:"fixed", left:"220px", top:0, right:0, bottom:0, background:"var(--bg)", zIndex:100, overflowY:"auto", display:"flex", flexDirection:"column" as const }}>
      {/* Header */}
      <div style={{ padding:"1.25rem 2rem", borderBottom:"1px solid var(--border)", background:"var(--surface)", display:"flex", alignItems:"center", gap:"1rem", flexShrink:0 }}>
        <button onClick={onClose} style={{ background:"transparent", border:"none", cursor:"pointer", color:"var(--text-muted)", fontSize:"1.4rem", lineHeight:1, padding:"0.1rem 0.4rem" }}>&#8592;</button>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
            <h1 style={{ margin:0, fontSize:"1.25rem", fontWeight:700 }}>{client.name}</h1>
            <span style={{ padding:"0.2rem 0.6rem", borderRadius:"6px", background:sColor+"22", color:sColor, fontSize:"0.75rem", fontWeight:600 }}>{STATUS_LABELS[client.status]||client.status}</span>
          </div>
          <div style={{ display:"flex", gap:"1.25rem", marginTop:"0.3rem" }}>
            {client.email && <span style={{ fontSize:"0.8rem", color:"var(--text-muted)" }}>{client.email}</span>}
            {client.phone && <span style={{ fontSize:"0.8rem", color:"var(--text-muted)" }}>{client.phone}</span>}
            {client.budget && <span style={{ fontSize:"0.8rem", color:"#22c55e", fontWeight:600 }}>Budget : {fmt(client.budget)}</span>}
          </div>
        </div>
        {/* KPIs rapides */}
        <div style={{ display:"flex", gap:"1.5rem", flexShrink:0 }}>
          <div style={{ textAlign:"right" as const }}>
            <p style={{ margin:0, fontSize:"0.65rem", color:"var(--text-muted)", fontWeight:600, textTransform:"uppercase" as const }}>Facture</p>
            <p style={{ margin:0, fontSize:"1.1rem", fontWeight:700, color:"#6366f1" }}>{fmt(totalFacture)}</p>
          </div>
          <div style={{ textAlign:"right" as const }}>
            <p style={{ margin:0, fontSize:"0.65rem", color:"var(--text-muted)", fontWeight:600, textTransform:"uppercase" as const }}>Paye</p>
            <p style={{ margin:0, fontSize:"1.1rem", fontWeight:700, color:"#22c55e" }}>{fmt(totalPaye)}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding:"0 2rem", borderBottom:"1px solid var(--border)", background:"var(--surface)", display:"flex", gap:"0.25rem", flexShrink:0 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding:"0.6rem 1rem", border:"none", background:"transparent", cursor:"pointer", fontWeight:600, fontSize:"0.82rem", color:tab===t?"var(--accent)":"var(--text-muted)", borderBottom:tab===t?"2px solid var(--accent)":"2px solid transparent", marginBottom:"-1px" }}>
            {TAB_LABELS[t]} {t==="factures"&&invoices.length?<span style={{fontSize:"0.7rem"}}>({invoices.length})</span>:null}
            {t==="taches"&&todos.length?<span style={{fontSize:"0.7rem"}}>({todos.length})</span>:null}
            {t==="projets"&&portfolio.length?<span style={{fontSize:"0.7rem"}}>({portfolio.length})</span>:null}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex:1, padding:"1.5rem 2rem", maxWidth:"900px" }}>

        {/* INFOS */}
        {tab === "infos" && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem" }}>
            <div className="genia-card" style={{ padding:"1.25rem" }}>
              <h3 style={{ margin:"0 0 1rem", fontSize:"0.85rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:"0.05em", color:"var(--text-muted)" }}>Coordonnees</h3>
              <div style={{ display:"flex", flexDirection:"column" as const, gap:"0.75rem" }}>
                {client.email && <div><span style={lbl}>Email</span><p style={val}>{client.email}</p></div>}
                {client.phone && <div><span style={lbl}>Telephone</span><p style={val}>{client.phone}</p></div>}
                {client.address && <div><span style={lbl}>Adresse</span><p style={{ ...val, whiteSpace:"pre-wrap" as const }}>{client.address}</p></div>}
                {client.siret && <div><span style={lbl}>SIRET</span><p style={val}>{client.siret}</p></div>}
                {client.contact && <div><span style={lbl}>Contact</span><p style={val}>{client.contact}</p></div>}
                {client.driveUrl && <div><span style={lbl}>Google Drive</span><a href={client.driveUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize:"0.85rem", color:"var(--accent)" }}>Ouvrir le dossier</a></div>}
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column" as const, gap:"1rem" }}>
              <div className="genia-card" style={{ padding:"1.25rem" }}>
                <h3 style={{ margin:"0 0 0.75rem", fontSize:"0.85rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:"0.05em", color:"var(--text-muted)" }}>Projet</h3>
                {client.budget && <div style={{ marginBottom:"0.5rem" }}><span style={lbl}>Budget</span><p style={{ ...val, color:"#22c55e", fontWeight:700 }}>{fmt(client.budget)}</p></div>}
                {client.tags && <div style={{ marginBottom:"0.5rem" }}><span style={lbl}>Tags</span><div style={{ display:"flex", gap:"0.3rem", flexWrap:"wrap" as const, marginTop:"0.3rem" }}>{client.tags.split(",").map(t=>t.trim()).filter(Boolean).map(t=><span key={t} style={{ padding:"0.1rem 0.5rem", borderRadius:"4px", background:"var(--bg)", fontSize:"0.72rem", border:"1px solid var(--border)" }}>{t}</span>)}</div></div>}
              </div>
              {client.notes && (
                <div className="genia-card" style={{ padding:"1.25rem" }}>
                  <span style={lbl}>Notes</span>
                  <p style={{ ...val, whiteSpace:"pre-wrap" as const, lineHeight:1.6, marginTop:"0.3rem" }}>{client.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PORTFOLIO */}
        {tab === "projets" && (
          <div>
            {portfolio.length === 0 ? (
              <div style={{ padding:"3rem", textAlign:"center" as const, color:"var(--text-muted)", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"10px" }}>Aucun projet dans le portfolio pour ce client.</div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:"1rem" }}>
                {portfolio.map(p => (
                  <a key={p.id} href={p.fileUrl || "#"} target={p.fileUrl?"_blank":"_self"} rel="noopener noreferrer" style={{ textDecoration:"none", display:"block", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"10px", overflow:"hidden" }}>
                    <div style={{ height:"130px", background:"var(--bg)", overflow:"hidden" }}>
                      {p.fileUrl ? (
                        p.type==="video"
                          ? <video src={p.fileUrl} style={{ width:"100%", height:"100%", objectFit:"cover" }} muted />
                          : <img src={p.fileUrl} alt={p.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      ) : <div style={{ height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"2rem" }}>🎬</div>}
                    </div>
                    <div style={{ padding:"0.625rem 0.75rem" }}>
                      <p style={{ margin:0, fontWeight:600, fontSize:"0.85rem", color:"var(--text)" }}>{p.title}</p>
                      {p.publishOnSite && <span style={{ fontSize:"0.65rem", background:"#22c55e22", color:"#16a34a", padding:"0.1rem 0.4rem", borderRadius:"3px", fontWeight:600 }}>SITE</span>}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FACTURES */}
        {tab === "factures" && (
          <div style={{ display:"flex", flexDirection:"column" as const, gap:"0.5rem" }}>
            {invoices.length === 0 ? (
              <div style={{ padding:"3rem", textAlign:"center" as const, color:"var(--text-muted)", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"10px" }}>Aucune facture pour ce client.</div>
            ) : invoices.map(inv => {
              const c = INV_COLORS[inv.type]||"#888";
              return (
                <div key={inv.id} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"10px", padding:"0.75rem 1rem", display:"flex", alignItems:"center", gap:"0.75rem" }}>
                  <div style={{ width:"4px", height:"36px", borderRadius:"2px", background:c, flexShrink:0 }} />
                  <div style={{ flex:1 }}>
                    <span style={{ fontWeight:700, fontSize:"0.88rem" }}>{inv.number}</span>
                    <span style={{ marginLeft:"0.5rem", fontSize:"0.72rem", color:"var(--text-muted)" }}>{fmtDate(inv.issueDate)}</span>
                  </div>
                  <span style={{ fontWeight:700, color:c }}>{fmt(inv.total)}</span>
                  <span style={{ padding:"0.15rem 0.5rem", borderRadius:"4px", background:inv.status==="paye"?"#22c55e22":"var(--bg)", color:inv.status==="paye"?"#16a34a":"var(--text-muted)", fontSize:"0.72rem", fontWeight:600 }}>{inv.status}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* TACHES */}
        {tab === "taches" && (
          <div style={{ display:"flex", flexDirection:"column" as const, gap:"0.375rem" }}>
            {todos.length === 0 ? (
              <div style={{ padding:"3rem", textAlign:"center" as const, color:"var(--text-muted)", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"10px" }}>Aucune tache pour ce client.</div>
            ) : todos.map(t => (
              <div key={t.id} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"8px", padding:"0.625rem 1rem", display:"flex", alignItems:"center", gap:"0.75rem", opacity:t.done?0.5:1 }}>
                <span style={{ width:"14px", height:"14px", borderRadius:"50%", border:t.done?"2px solid #22c55e":"2px solid var(--border)", background:t.done?"#22c55e":"transparent", flexShrink:0 }} />
                <span style={{ flex:1, fontSize:"0.88rem", textDecoration:t.done?"line-through":"none" }}>{t.title}</span>
                <span style={{ fontSize:"0.72rem", color:"var(--text-muted)" }}>{fmtDate(t.createdAt)}</span>
              </div>
            ))}
          </div>
        )}

        {/* SOCIAL */}
        {tab === "social" && (
          <div style={{ display:"flex", flexDirection:"column" as const, gap:"0.375rem" }}>
            {socialPosts.length === 0 ? (
              <div style={{ padding:"3rem", textAlign:"center" as const, color:"var(--text-muted)", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"10px" }}>Aucun post social pour ce client.</div>
            ) : socialPosts.map(p => {
              const pc = PLAT_COLORS[p.platform]||"#888";
              return (
                <div key={p.id} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"8px", padding:"0.625rem 1rem", display:"flex", alignItems:"center", gap:"0.75rem" }}>
                  <div style={{ width:"28px", height:"28px", borderRadius:"6px", background:pc, flexShrink:0 }} />
                  <span style={{ flex:1, fontSize:"0.88rem" }}>{p.title}</span>
                  {p.scheduledAt && <span style={{ fontSize:"0.72rem", color:"var(--text-muted)" }}>{fmtDate(p.scheduledAt)}</span>}
                  <span style={{ padding:"0.15rem 0.5rem", borderRadius:"4px", background:"var(--bg)", fontSize:"0.72rem", color:p.status==="publie"?"#22c55e":"var(--text-muted)", fontWeight:600 }}>{p.status}</span>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
