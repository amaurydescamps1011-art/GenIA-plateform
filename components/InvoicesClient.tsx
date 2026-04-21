"use client";
import { CSSProperties, useState, useCallback, useEffect } from "react";

type Item = { id: string; description: string; qty: number; unitPrice: number };
type Invoice = { id: string; type: string; number: string; status: string; clientId: string; clientName: string; clientEmail: string; clientAddress: string; items: Item[] | string; subtotal: number; taxRate: number; taxAmount: number; total: number; notes: string; validUntil: string; dueDate: string; issueDate: string; parentId: string; createdAt: string };
type InvoiceForm = { type: string; clientId: string; clientName: string; clientEmail: string; clientAddress: string; items: Item[]; taxRate: number; notes: string; validUntil: string; dueDate: string; issueDate: string; status: string; parentId: string; subtotal?: number; taxAmount?: number; total?: number };
type Client = { id: string; name: string; email: string; address?: string };

const TYPE_LABELS: Record<string, string> = { devis: "Devis", acompte: "Acompte", facture: "Facture" };
const TYPE_COLORS: Record<string, string> = { devis: "#6366f1", acompte: "#f97316", facture: "#22c55e" };
const STATUS_LABELS: Record<string, string> = { brouillon: "Brouillon", envoye: "Envoye", accepte: "Accepte", refuse: "Refuse", paye: "Paye", annule: "Annule" };
const STATUS_COLORS: Record<string, string> = { brouillon: "#94a3b8", envoye: "#3b82f6", accepte: "#22c55e", refuse: "#ef4444", paye: "#16a34a", annule: "#6b7280" };

function fmt(n: number) { return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"; }
function fmtDate(s: string) { if (!s) return ""; const d = new Date(s); return d.toLocaleDateString("fr-FR"); }
function today() { return new Date().toISOString().split("T")[0]; }
function uid() { return Math.random().toString(36).slice(2); }
function parseItems(raw: Item[] | string): Item[] { return typeof raw === "string" ? JSON.parse(raw) : raw; }

const EMPTY_FORM = (): InvoiceForm => ({ type: "devis", clientId: "", clientName: "", clientEmail: "", clientAddress: "", items: [], taxRate: 20, notes: "", validUntil: "", dueDate: "", issueDate: today(), status: "brouillon", parentId: "" });

// ─── Print View ───────────────────────────────────────────────────────────
function PrintView({ inv, onClose }: { inv: Invoice; onClose: () => void }) {
  const items = parseItems(inv.items);
  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const taxAmt = Math.round(subtotal * inv.taxRate / 100 * 100) / 100;
  const total = Math.round((subtotal + taxAmt) * 100) / 100;
  const typeLabel = TYPE_LABELS[inv.type] || inv.type;
  const color = TYPE_COLORS[inv.type] || "#6366f1";
  return (
    <div style={{ position: "fixed", inset: 0, background: "#fff", zIndex: 500, overflowY: "auto", color: "#111" }}>
      <style>{"@media print { .no-print { display:none !important; } body { margin:0; } }"}</style>
      <div className="no-print" style={{ padding: "1rem 2rem", borderBottom: "1px solid #e5e7eb", display: "flex", gap: "0.75rem", alignItems: "center", background: "#f9fafb" }}>
        <button onClick={onClose} style={{ padding: "0.4rem 0.875rem", border: "1px solid #d1d5db", borderRadius: "6px", background: "#fff", cursor: "pointer", fontSize: "0.85rem" }}>← Retour</button>
        <button onClick={() => window.print()} style={{ padding: "0.4rem 1rem", border: "none", borderRadius: "6px", background: color, color: "#fff", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>Imprimer / PDF</button>
        <span style={{ fontSize: "0.78rem", color: "#6b7280", marginLeft: "0.5rem" }}>Ctrl+P pour enregistrer en PDF</span>
      </div>
      <div style={{ maxWidth: "800px", margin: "2rem auto", padding: "0 2rem 4rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2.5rem" }}>
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: "0 0 0.25rem", color }}>{typeLabel.toUpperCase()}</h1>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "#374151", fontWeight: 600 }}>{inv.number}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: "0 0 0.25rem", fontWeight: 700, fontSize: "1.1rem" }}>GenIA Studio</p>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "#6b7280", lineHeight: 1.6 }}>contact@genia.studio</p>
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.82rem", color: "#6b7280" }}>Date : {fmtDate(inv.issueDate) || fmtDate(today())}</p>
            {inv.type === "devis" && inv.validUntil && <p style={{ margin: 0, fontSize: "0.82rem", color: "#6b7280" }}>Valable jusqu&apos;au : {fmtDate(inv.validUntil)}</p>}
            {inv.type !== "devis" && inv.dueDate && <p style={{ margin: 0, fontSize: "0.82rem", color: "#6b7280" }}>Echeance : {fmtDate(inv.dueDate)}</p>}
          </div>
        </div>
        {inv.clientName && (
          <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "1rem 1.25rem", marginBottom: "2rem" }}>
            <p style={{ fontSize: "0.72rem", color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 0.5rem" }}>Client</p>
            <p style={{ margin: "0 0 0.125rem", fontWeight: 600, fontSize: "0.95rem" }}>{inv.clientName}</p>
            {inv.clientEmail && <p style={{ margin: "0 0 0.125rem", fontSize: "0.85rem", color: "#374151" }}>{inv.clientEmail}</p>}
            {inv.clientAddress && <p style={{ margin: 0, fontSize: "0.85rem", color: "#374151" }}>{inv.clientAddress}</p>}
          </div>
        )}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "1.5rem" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid " + color }}>
              <th style={{ textAlign: "left", padding: "0.625rem 0", fontSize: "0.78rem", color, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>Description</th>
              <th style={{ textAlign: "center", padding: "0.625rem 0.5rem", fontSize: "0.78rem", color, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, width: "60px" }}>Qte</th>
              <th style={{ textAlign: "right", padding: "0.625rem 0.5rem", fontSize: "0.78rem", color, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, width: "120px" }}>PU HT</th>
              <th style={{ textAlign: "right", padding: "0.625rem 0", fontSize: "0.78rem", color, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, width: "120px" }}>Total HT</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item.id || i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "0.75rem 0", fontSize: "0.9rem" }}>{item.description}</td>
                <td style={{ padding: "0.75rem 0.5rem", textAlign: "center", fontSize: "0.9rem" }}>{item.qty}</td>
                <td style={{ padding: "0.75rem 0.5rem", textAlign: "right", fontSize: "0.9rem" }}>{fmt(item.unitPrice)}</td>
                <td style={{ padding: "0.75rem 0", textAlign: "right", fontSize: "0.9rem", fontWeight: 600 }}>{fmt(item.qty * item.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.5rem" }}>
          <div style={{ width: "260px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid #e5e7eb", fontSize: "0.9rem" }}><span style={{ color: "#6b7280" }}>Sous-total HT</span><span style={{ fontWeight: 600 }}>{fmt(subtotal)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid #e5e7eb", fontSize: "0.9rem" }}><span style={{ color: "#6b7280" }}>TVA ({inv.taxRate}%)</span><span style={{ fontWeight: 600 }}>{fmt(taxAmt)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0", fontSize: "1.1rem", fontWeight: 700, color }}><span>TOTAL TTC</span><span>{fmt(total)}</span></div>
          </div>
        </div>
        {inv.notes && (
          <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "1.25rem" }}>
            <p style={{ fontSize: "0.72rem", color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 0.5rem" }}>Notes</p>
            <p style={{ fontSize: "0.85rem", color: "#374151", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>{inv.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Items Editor ─────────────────────────────────────────────────────────
function ItemsEditor({ items, onChange }: { items: Item[]; onChange: (items: Item[]) => void }) {
  function update(i: number, field: keyof Item, val: string) {
    const next = items.map((it, idx) => idx !== i ? it : { ...it, [field]: field === "description" ? val : parseFloat(val) || 0 });
    onChange(next);
  }
  function addRow() { onChange([...items, { id: uid(), description: "", qty: 1, unitPrice: 0 }]); }
  function removeRow(i: number) { onChange(items.filter((_, idx) => idx !== i)); }

  const th: CSSProperties = { padding: "0.4rem 0.5rem", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-muted)", fontWeight: 600, textAlign: "left" };
  const td: CSSProperties = { padding: "0.25rem 0.5rem" };

  return (
    <div>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "0.5rem" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            <th style={{ ...th, width: "45%" }}>Description</th>
            <th style={{ ...th, width: "60px", textAlign: "center" }}>Qte</th>
            <th style={{ ...th, width: "130px", textAlign: "right" }}>PU HT (€)</th>
            <th style={{ ...th, width: "110px", textAlign: "right" }}>Total HT</th>
            <th style={{ ...th, width: "32px" }}></th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={it.id} style={{ borderBottom: "1px solid var(--border)" }}>
              <td style={td}><input className="genia-input" style={{ width: "100%", padding: "0.35rem 0.5rem", fontSize: "0.85rem" }} value={it.description} onChange={e => update(i, "description", e.target.value)} placeholder="Prestation..." /></td>
              <td style={{ ...td, textAlign: "center" }}><input className="genia-input" type="number" min="1" style={{ width: "52px", padding: "0.35rem 0.4rem", fontSize: "0.85rem", textAlign: "center" }} value={it.qty} onChange={e => update(i, "qty", e.target.value)} /></td>
              <td style={{ ...td, textAlign: "right" }}><input className="genia-input" type="number" min="0" step="0.01" style={{ width: "110px", padding: "0.35rem 0.5rem", fontSize: "0.85rem", textAlign: "right" }} value={it.unitPrice} onChange={e => update(i, "unitPrice", e.target.value)} /></td>
              <td style={{ ...td, textAlign: "right", fontSize: "0.88rem", fontWeight: 600, color: "var(--text)" }}>{fmt(it.qty * it.unitPrice)}</td>
              <td style={{ ...td, textAlign: "center" }}><button onClick={() => removeRow(i)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1rem", lineHeight: 1 }}>&times;</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="genia-btn-ghost" onClick={addRow} style={{ fontSize: "0.82rem" }}>+ Ajouter une ligne</button>
    </div>
  );
}

// ─── Invoice Editor Modal ─────────────────────────────────────────────────
function InvoiceEditor({ initial, clients, onSave, onClose }: { initial: Partial<InvoiceForm>; clients: Client[]; onSave: (form: InvoiceForm) => Promise<void>; onClose: () => void }) {
  const [form, setForm] = useState<InvoiceForm>({ ...EMPTY_FORM(), ...initial });
  const [saving, setSaving] = useState(false);

  function set<K extends keyof InvoiceForm>(key: K, val: InvoiceForm[K]) {
    setForm(f => ({ ...f, [key]: val }));
  }

  function pickClient(clientId: string) {
    const c = clients.find(x => x.id === clientId);
    if (!c) return;
    setForm(f => ({ ...f, clientId: c.id, clientName: c.name, clientEmail: c.email, clientAddress: c.address || "" }));
  }

  const subtotal = form.items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
  const taxAmt = subtotal * form.taxRate / 100;
  const total = subtotal + taxAmt;

  async function handleSave() {
    setSaving(true);
    await onSave({ ...form, subtotal, taxAmount: taxAmt, total });
    setSaving(false);
  }

  const typeColor = TYPE_COLORS[form.type] || "#6b7280";
  const label: CSSProperties = { fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" };
  const inputStyle: CSSProperties = { width: "100%" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: "var(--surface)", borderRadius: "14px", width: "100%", maxWidth: "720px", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid var(--border)" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>{initial.type && initial.clientName ? "Modifier" : "Nouveau"} {TYPE_LABELS[form.type] || form.type}</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.3rem", lineHeight: 1 }}>&times;</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={label}>Type</label>
              <select className="genia-input" style={inputStyle} value={form.type} onChange={e => set("type", e.target.value)}>
                {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Client (CRM)</label>
              <select className="genia-input" style={inputStyle} value={form.clientId} onChange={e => pickClient(e.target.value)}>
                <option value="">-- Choisir un client --</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={label}>Nom client</label>
              <input className="genia-input" style={inputStyle} value={form.clientName} onChange={e => set("clientName", e.target.value)} placeholder="Nom ou societe" />
            </div>
            <div>
              <label style={label}>Email client</label>
              <input className="genia-input" style={inputStyle} type="email" value={form.clientEmail} onChange={e => set("clientEmail", e.target.value)} placeholder="email@client.com" />
            </div>
          </div>
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={label}>Adresse client</label>
            <input className="genia-input" style={inputStyle} value={form.clientAddress} onChange={e => set("clientAddress", e.target.value)} placeholder="Adresse de facturation" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
            <div>
              <label style={label}>Date emission</label>
              <input className="genia-input" style={inputStyle} type="date" value={form.issueDate || today()} onChange={e => set("issueDate", e.target.value)} />
            </div>
            <div>
              <label style={label}>{form.type === "devis" ? "Valable jusqu\'au" : "Echeance"}</label>
              <input className="genia-input" style={inputStyle} type="date" value={form.type === "devis" ? form.validUntil : form.dueDate} onChange={e => set(form.type === "devis" ? "validUntil" : "dueDate", e.target.value)} />
            </div>
            <div>
              <label style={label}>TVA (%)</label>
              <input className="genia-input" style={inputStyle} type="number" min="0" max="100" step="0.5" value={form.taxRate} onChange={e => set("taxRate", parseFloat(e.target.value) || 0)} />
            </div>
          </div>
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ ...label, marginBottom: "0.5rem" }}>Prestations</label>
            <ItemsEditor items={form.items} onChange={items => set("items", items)} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.25rem" }}>
            <div style={{ width: "240px", fontSize: "0.88rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.3rem 0" }}><span style={{ color: "var(--text-muted)" }}>Sous-total HT</span><span style={{ fontWeight: 600 }}>{fmt(subtotal)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.3rem 0", borderBottom: "1px solid var(--border)" }}><span style={{ color: "var(--text-muted)" }}>TVA {form.taxRate}%</span><span style={{ fontWeight: 600 }}>{fmt(taxAmt)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", fontWeight: 700, color: typeColor }}><span>Total TTC</span><span>{fmt(total)}</span></div>
            </div>
          </div>
          <div>
            <label style={label}>Notes / conditions</label>
            <textarea className="genia-input" style={{ ...inputStyle, height: "80px", resize: "vertical" }} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Modalites de paiement, delais..." />
          </div>
        </div>
        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
          <button className="genia-btn-ghost" onClick={onClose}>Annuler</button>
          <button className="genia-btn" onClick={handleSave} disabled={saving} style={{ background: typeColor, borderColor: typeColor }}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Invoice List ─────────────────────────────────────────────────────────
function InvoiceList({ invoices, onView, onEdit, onDelete, onConvert }: { invoices: Invoice[]; onView: (inv: Invoice) => void; onEdit: (inv: Invoice) => void; onDelete: (id: string) => void; onConvert: (inv: Invoice) => void }) {
  const [tab, setTab] = useState<"devis" | "acompte" | "facture">("devis");
  const filtered = invoices.filter(i => i.type === tab);
  const tabs: Array<"devis" | "acompte" | "facture"> = ["devis", "acompte", "facture"];

  return (
    <div>
      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.25rem" }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "0.4rem 1rem", borderRadius: "6px", border: "1px solid var(--border)", background: tab === t ? TYPE_COLORS[t] : "transparent", color: tab === t ? "#fff" : "var(--text-muted)", cursor: "pointer", fontWeight: 600, fontSize: "0.82rem" }}>
            {TYPE_LABELS[t]} ({invoices.filter(i => i.type === t).length})
          </button>
        ))}
      </div>
      {filtered.length === 0 && (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px" }}>
          Aucun {TYPE_LABELS[tab].toLowerCase()} pour l&apos;instant
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {filtered.map(inv => {
          const color = TYPE_COLORS[inv.type] || "#6b7280";
          const sColor = STATUS_COLORS[inv.status] || "#6b7280";
          const canConvert = (inv.type === "devis" && inv.status !== "perdu") || inv.type === "acompte";
          return (
            <div key={inv.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "0.875rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: "4px", height: "40px", borderRadius: "2px", background: color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.125rem" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{inv.number}</span>
                  <span style={{ padding: "0.1rem 0.5rem", borderRadius: "4px", background: sColor + "22", color: sColor, fontSize: "0.72rem", fontWeight: 600 }}>{STATUS_LABELS[inv.status] || inv.status}</span>
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{inv.clientName || "Sans client"} &middot; {fmt(inv.total)} TTC &middot; {fmtDate(inv.issueDate)}</div>
              </div>
              <div style={{ display: "flex", gap: "0.375rem", flexShrink: 0 }}>
                <button onClick={() => onView(inv)} className="genia-btn-ghost" style={{ fontSize: "0.78rem", padding: "0.3rem 0.625rem" }}>Voir</button>
                <button onClick={() => onEdit(inv)} className="genia-btn-ghost" style={{ fontSize: "0.78rem", padding: "0.3rem 0.625rem" }}>Editer</button>
                {canConvert && (
                  <button onClick={() => onConvert(inv)} className="genia-btn" style={{ fontSize: "0.78rem", padding: "0.3rem 0.625rem", background: color, borderColor: color }}>
                    {inv.type === "devis" ? "→ Acompte" : "→ Facture"}
                  </button>
                )}
                <button onClick={() => onDelete(inv.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1rem", padding: "0.3rem 0.4rem" }}>&times;</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────
export default function InvoicesClient() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<Partial<InvoiceForm> | null>(null);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [viewing, setViewing] = useState<Invoice | null>(null);

  const fetchAll = useCallback(async () => {
    const [ir, cr] = await Promise.all([fetch("/api/invoices"), fetch("/api/crm")]);
    if (ir.ok) {
      const data = await ir.json();
      setInvoices(data.map((inv: Invoice) => ({ ...inv, items: parseItems(inv.items) })));
    }
    if (cr.ok) {
      const data = await cr.json();
      setClients(data.map((c: { id: string; name: string; email?: string; address?: string }) => ({ id: c.id, name: c.name, email: c.email || "", address: c.address || "" })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleSave(form: InvoiceForm) {
    const body = { ...form, items: JSON.stringify(form.items) };
    if (editing) {
      await fetch("/api/invoices/" + editing.id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      setEditing(null);
    } else {
      await fetch("/api/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      setCreating(null);
    }
    fetchAll();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce document ?")) return;
    await fetch("/api/invoices/" + id, { method: "DELETE" });
    fetchAll();
  }

  async function handleConvert(inv: Invoice) {
    const targetType = inv.type === "devis" ? "acompte" : "facture";
    const label = inv.type === "devis" ? "acompte (50%)" : "facture finale";
    if (!confirm("Convertir en " + label + " ?")) return;
    const items = parseItems(inv.items);
    const newItems = inv.type === "devis" ? items.map(it => ({ ...it, id: uid(), unitPrice: it.unitPrice * 0.5 })) : items.map(it => ({ ...it, id: uid() }));
    const body = { type: targetType, clientId: inv.clientId, clientName: inv.clientName, clientEmail: inv.clientEmail, clientAddress: inv.clientAddress, items: JSON.stringify(newItems), taxRate: inv.taxRate, notes: inv.notes, issueDate: today(), parentId: inv.id };
    await fetch("/api/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    fetchAll();
  }

  const totals = {
    devis: invoices.filter(i => i.type === "devis").reduce((s, i) => s + i.total, 0),
    acompte: invoices.filter(i => i.type === "acompte").reduce((s, i) => s + i.total, 0),
    facture: invoices.filter(i => i.type === "facture").reduce((s, i) => s + i.total, 0),
  };

  if (loading) return <div style={{ padding: "2rem", color: "var(--text-muted)" }}>Chargement...</div>;

  return (
    <div style={{ padding: "1.5rem", maxWidth: "860px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.375rem", fontWeight: 700, margin: 0 }}>Facturation</h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.25rem 0 0" }}>Devis, acomptes et factures</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="genia-btn-ghost" onClick={() => setCreating({ type: "devis" })} style={{ fontSize: "0.82rem" }}>+ Devis</button>
          <button className="genia-btn-ghost" onClick={() => setCreating({ type: "acompte" })} style={{ fontSize: "0.82rem" }}>+ Acompte</button>
          <button className="genia-btn" onClick={() => setCreating({ type: "facture" })} style={{ fontSize: "0.82rem" }}>+ Facture</button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {(["devis", "acompte", "facture"] as const).map(t => (
          <div key={t} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "0.875rem 1rem", borderLeft: "4px solid " + TYPE_COLORS[t] }}>
            <p style={{ margin: "0 0 0.25rem", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: TYPE_COLORS[t] }}>{TYPE_LABELS[t]}</p>
            <p style={{ margin: "0 0 0.125rem", fontSize: "1.25rem", fontWeight: 700 }}>{fmt(totals[t])}</p>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>{invoices.filter(i => i.type === t).length} document(s)</p>
          </div>
        ))}
      </div>
      <InvoiceList invoices={invoices} onView={inv => setViewing(inv)} onEdit={inv => setEditing(inv)} onDelete={handleDelete} onConvert={handleConvert} />
      {(creating || editing) && (
        <InvoiceEditor
          initial={editing ? { ...editing, items: parseItems(editing.items) } : (creating || {})}
          clients={clients}
          onSave={handleSave}
          onClose={() => { setCreating(null); setEditing(null); }}
        />
      )}
      {viewing && <PrintView inv={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
