"use client";
import { CSSProperties, useState, useCallback, useEffect, useRef } from "react";

type Expense = {
  id: string;
  label: string;
  amount: number;
  category: string;
  date: string;
  fileUrl: string;
  notes: string;
  createdAt: string;
};

const CATEGORIES: Record<string, { label: string; color: string }> = {
  logiciel:   { label: "Logiciel / SaaS",     color: "#6366f1" },
  freelance:  { label: "Freelance / Sous-traitance", color: "#f97316" },
  publicite:  { label: "Publicite",            color: "#eab308" },
  materiel:   { label: "Materiel",             color: "#3b82f6" },
  abonnement: { label: "Abonnement",           color: "#8b5cf6" },
  formation:  { label: "Formation",            color: "#06b6d4" },
  autre:      { label: "Autre",                color: "#94a3b8" },
};

function fmt(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}
function fmtDate(s: string) {
  if (!s) return "";
  return new Date(s).toLocaleDateString("fr-FR");
}
function today() { return new Date().toISOString().split("T")[0]; }

const EMPTY = (): Partial<Expense> => ({ label: "", amount: 0, category: "autre", date: today(), notes: "" });

// ─── Form Modal ───────────────────────────────────────────────────────────
function ExpenseForm({ initial, onSave, onClose }: { initial: Partial<Expense>; onSave: (e: Partial<Expense>) => Promise<void>; onClose: () => void }) {
  const [form, setForm] = useState<Partial<Expense>>(initial);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof Expense>(k: K, v: Expense[K]) { setForm(f => ({ ...f, [k]: v })); }

  async function submit() {
    if (!form.label?.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  const label: CSSProperties = { fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: "var(--surface)", borderRadius: "14px", width: "100%", maxWidth: "520px", border: "1px solid var(--border)", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>{initial.id ? "Modifier" : "Nouvelle"} depense</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.3rem" }}>&times;</button>
        </div>
        <div style={{ padding: "1.25rem 1.5rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div>
            <label style={label}>Libelle *</label>
            <input className="genia-input" style={{ width: "100%" }} value={form.label || ""} onChange={e => set("label", e.target.value)} placeholder="Ex : Adobe Premiere, Freelance montage..." autoFocus />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={label}>Montant TTC (€)</label>
              <input className="genia-input" style={{ width: "100%" }} type="number" min="0" step="0.01" value={form.amount ?? ""} onChange={e => set("amount", parseFloat(e.target.value) || 0)} placeholder="0.00" />
            </div>
            <div>
              <label style={label}>Date</label>
              <input className="genia-input" style={{ width: "100%" }} type="date" value={form.date || today()} onChange={e => set("date", e.target.value)} />
            </div>
          </div>
          <div>
            <label style={label}>Categorie</label>
            <select className="genia-input" style={{ width: "100%", background: "var(--surface)", color: "var(--text)" }} value={form.category || "autre"} onChange={e => set("category", e.target.value)}>
              {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Notes</label>
            <textarea className="genia-input" style={{ width: "100%", height: "70px", resize: "vertical" }} value={form.notes || ""} onChange={e => set("notes", e.target.value)} placeholder="Notes..." />
          </div>
        </div>
        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border)", display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <button className="genia-btn-ghost" onClick={onClose}>Annuler</button>
          <button className="genia-btn" onClick={submit} disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Upload Receipt ───────────────────────────────────────────────────────
function UploadReceipt({ expense, onUploaded }: { expense: Expense; onUploaded: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/expenses/" + expense.id + "/upload", { method: "POST", body: fd });
    if (res.ok) { const { url } = await res.json(); onUploaded(url); }
    setUploading(false);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <input ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }} onChange={e => e.target.files?.[0] && upload(e.target.files[0])} />
      {expense.fileUrl ? (
        <a href={expense.fileUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.75rem", color: "#6366f1", textDecoration: "none", fontWeight: 600 }}>
          📎 Justificatif
        </a>
      ) : (
        <button onClick={() => ref.current?.click()} disabled={uploading} className="genia-btn-ghost" style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem" }}>
          {uploading ? "..." : "📎 Joindre"}
        </button>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────
export default function ExpensesClient() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [filterCat, setFilterCat] = useState("all");

  const fetchAll = useCallback(async () => {
    const res = await fetch("/api/expenses");
    if (res.ok) setExpenses(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleSave(form: Partial<Expense>) {
    if (editing) {
      await fetch("/api/expenses/" + editing.id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setEditing(null);
    } else {
      await fetch("/api/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setCreating(false);
    }
    fetchAll();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette depense ?")) return;
    await fetch("/api/expenses/" + id, { method: "DELETE" });
    fetchAll();
  }

  const filtered = filterCat === "all" ? expenses : expenses.filter(e => e.category === filterCat);
  const totalAll = expenses.reduce((s, e) => s + e.amount, 0);

  // Par catégorie pour le résumé
  const byCategory = Object.entries(CATEGORIES).map(([k, meta]) => ({
    key: k, ...meta,
    total: expenses.filter(e => e.category === k).reduce((s, e) => s + e.amount, 0),
    count: expenses.filter(e => e.category === k).length,
  })).filter(c => c.count > 0);

  if (loading) return <div style={{ padding: "2rem", color: "var(--text-muted)" }}>Chargement...</div>;

  return (
    <div style={{ padding: "1.5rem", maxWidth: "900px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.375rem", fontWeight: 700, margin: 0 }}>Comptabilite</h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.25rem 0 0" }}>Charges et depenses</p>
        </div>
        <button className="genia-btn" onClick={() => setCreating(true)}>+ Depense</button>
      </div>

      {/* KPI total */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <div className="genia-card" style={{ padding: "1rem", borderLeft: "4px solid #ef4444" }}>
          <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#ef4444" }}>Total charges</p>
          <p style={{ margin: "0.25rem 0 0", fontSize: "1.5rem", fontWeight: 700 }}>{fmt(totalAll)}</p>
          <p style={{ margin: "0.1rem 0 0", fontSize: "0.72rem", color: "var(--text-muted)" }}>{expenses.length} depense(s)</p>
        </div>
        {byCategory.map(c => (
          <div key={c.key} className="genia-card" style={{ padding: "1rem", borderLeft: "4px solid " + c.color }}>
            <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: c.color }}>{c.label}</p>
            <p style={{ margin: "0.25rem 0 0", fontSize: "1.25rem", fontWeight: 700 }}>{fmt(c.total)}</p>
            <p style={{ margin: "0.1rem 0 0", fontSize: "0.72rem", color: "var(--text-muted)" }}>{c.count} depense(s)</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <button onClick={() => setFilterCat("all")} style={{ padding: "0.3rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border)", background: filterCat === "all" ? "var(--accent)" : "transparent", color: filterCat === "all" ? "#fff" : "var(--text-muted)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>
          Toutes ({expenses.length})
        </button>
        {Object.entries(CATEGORIES).map(([k, v]) => {
          const n = expenses.filter(e => e.category === k).length;
          if (!n) return null;
          return (
            <button key={k} onClick={() => setFilterCat(k)} style={{ padding: "0.3rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border)", background: filterCat === k ? v.color : "transparent", color: filterCat === k ? "#fff" : "var(--text-muted)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>
              {v.label} ({n})
            </button>
          );
        })}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px" }}>
          Aucune depense enregistree
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          {filtered.map(exp => {
            const cat = CATEGORIES[exp.category] || CATEGORIES.autre;
            return (
              <div key={exp.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: "4px", height: "36px", borderRadius: "2px", background: cat.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.88rem" }}>{exp.label}</span>
                    <span style={{ padding: "0.1rem 0.45rem", borderRadius: "4px", background: cat.color + "22", color: cat.color, fontSize: "0.7rem", fontWeight: 600 }}>{cat.label}</span>
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                    {fmtDate(exp.date)}{exp.notes ? " · " + exp.notes : ""}
                  </div>
                </div>
                <UploadReceipt expense={exp} onUploaded={() => fetchAll()} />
                <span style={{ fontWeight: 700, fontSize: "0.95rem", minWidth: "90px", textAlign: "right" }}>{fmt(exp.amount)}</span>
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  <button onClick={() => setEditing(exp)} className="genia-btn-ghost" style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}>Editer</button>
                  <button onClick={() => handleDelete(exp.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1rem" }}>&times;</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(creating || editing) && (
        <ExpenseForm
          initial={editing || EMPTY()}
          onSave={handleSave}
          onClose={() => { setCreating(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
