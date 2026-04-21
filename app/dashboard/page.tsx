import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/dashboard/crm");
  const uid = user.id;

  const [clientCount, todoCount, clientsByStatus, invoices, expenses] = await Promise.all([
    prisma.client.count({ where: { createdBy: uid } }),
    prisma.todo.count({ where: { createdBy: uid, done: false } }),
    prisma.client.groupBy({ by: ["status"], where: { createdBy: uid }, _count: true }),
    prisma.invoice.findMany({ where: { createdBy: uid }, select: { type: true, status: true, total: true, issueDate: true } }),
    prisma.expense.findMany({ where: { createdBy: uid }, select: { amount: true, date: true } }),
  ]);

  const cashCollecte = invoices.filter(i => i.status === "paye").reduce((s, i) => s + i.total, 0);
  const cashContracte = invoices.filter(i => ["acompte", "facture"].includes(i.type) && i.status !== "annule").reduce((s, i) => s + i.total, 0);
  const devisEnAttente = invoices.filter(i => i.type === "devis" && ["brouillon", "envoye"].includes(i.status)).reduce((s, i) => s + i.total, 0);
  const facturesImpayees = invoices.filter(i => ["acompte", "facture"].includes(i.type) && !["paye", "annule"].includes(i.status)).reduce((s, i) => s + i.total, 0);
  const totalCharges = expenses.reduce((s, e) => s + e.amount, 0);
  const marge = cashCollecte - totalCharges;

  function fmt(n: number) {
    return n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " €";
  }

  // ── Graphique 6 derniers mois ──────────────────────────────────────────
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString("fr-FR", { month: "short" }) };
  });

  const chartData = months.map(m => {
    const rev = invoices
      .filter(i => i.status === "paye" && i.issueDate)
      .filter(i => { const d = new Date(i.issueDate); return d.getFullYear() === m.year && d.getMonth() === m.month; })
      .reduce((s, i) => s + i.total, 0);
    const exp = expenses
      .filter(e => e.date)
      .filter(e => { const d = new Date(e.date); return d.getFullYear() === m.year && d.getMonth() === m.month; })
      .reduce((s, e) => s + e.amount, 0);
    return { ...m, rev, exp, margin: rev - exp };
  });

  const chartMax = Math.max(...chartData.flatMap(d => [d.rev, d.exp]), 1);
  const W = 520; const H = 140; const BAR_W = 22; const GAP = 14;
  const colW = (W - GAP) / 6;

  const STATUS_LABELS: Record<string, string> = {
    prospect: "Prospect", verbal: "Confirmation verbale", acompte: "Acompte paye",
    en_cours: "En cours", termine: "Termine", followup: "Follow-up", perdu: "Perdu",
  };
  const STATUS_COLORS: Record<string, string> = {
    prospect: "#eab308", verbal: "#f97316", acompte: "#22c55e",
    en_cours: "#6366f1", termine: "#16a34a", followup: "#8b5cf6", perdu: "#ef4444",
  };

  return (
    <div style={{ padding: "1.5rem", maxWidth: "960px" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Bonjour, {user?.name || user?.email}</h1>
        <p style={{ color: "var(--text-muted)", marginTop: "0.25rem", fontSize: "0.875rem" }}>Plateforme GenIA Studio</p>
      </div>

      {/* Ligne 1 : ops */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.75rem", marginBottom: "0.75rem" }}>
        <Link href="/dashboard/crm" style={{ textDecoration: "none" }}>
          <div className="genia-card" style={{ padding: "1rem", cursor: "pointer" }}>
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Clients</p>
            <p style={{ fontSize: "1.875rem", fontWeight: 700, margin: "0.2rem 0 0" }}>{clientCount}</p>
          </div>
        </Link>
        <Link href="/dashboard/todos" style={{ textDecoration: "none" }}>
          <div className="genia-card" style={{ padding: "1rem", cursor: "pointer" }}>
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Taches</p>
            <p style={{ fontSize: "1.875rem", fontWeight: 700, margin: "0.2rem 0 0", color: todoCount > 0 ? "#f97316" : "var(--text)" }}>{todoCount}</p>
          </div>
        </Link>
        <Link href="/dashboard/invoices" style={{ textDecoration: "none" }}>
          <div className="genia-card" style={{ padding: "1rem", cursor: "pointer" }}>
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Devis en attente</p>
            <p style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.2rem 0 0", color: devisEnAttente > 0 ? "#6366f1" : "var(--text)" }}>{fmt(devisEnAttente)}</p>
          </div>
        </Link>
        <Link href="/dashboard/invoices" style={{ textDecoration: "none" }}>
          <div className="genia-card" style={{ padding: "1rem", cursor: "pointer" }}>
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>A encaisser</p>
            <p style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.2rem 0 0", color: facturesImpayees > 0 ? "#f97316" : "var(--text)" }}>{fmt(facturesImpayees)}</p>
          </div>
        </Link>
      </div>

      {/* Ligne 2 : financier */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <Link href="/dashboard/invoices" style={{ textDecoration: "none" }}>
          <div className="genia-card" style={{ padding: "1rem", cursor: "pointer", borderLeft: "4px solid #6366f1" }}>
            <p style={{ fontSize: "0.7rem", color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, margin: 0 }}>Cash contracte</p>
            <p style={{ fontSize: "1.375rem", fontWeight: 700, margin: "0.2rem 0 0" }}>{fmt(cashContracte)}</p>
          </div>
        </Link>
        <Link href="/dashboard/invoices" style={{ textDecoration: "none" }}>
          <div className="genia-card" style={{ padding: "1rem", cursor: "pointer", borderLeft: "4px solid #22c55e" }}>
            <p style={{ fontSize: "0.7rem", color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, margin: 0 }}>Cash collecte</p>
            <p style={{ fontSize: "1.375rem", fontWeight: 700, margin: "0.2rem 0 0" }}>{fmt(cashCollecte)}</p>
          </div>
        </Link>
        <Link href="/dashboard/compta" style={{ textDecoration: "none" }}>
          <div className="genia-card" style={{ padding: "1rem", cursor: "pointer", borderLeft: "4px solid #ef4444" }}>
            <p style={{ fontSize: "0.7rem", color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, margin: 0 }}>Charges</p>
            <p style={{ fontSize: "1.375rem", fontWeight: 700, margin: "0.2rem 0 0" }}>{fmt(totalCharges)}</p>
          </div>
        </Link>
        <div className="genia-card" style={{ padding: "1rem", borderLeft: "4px solid " + (marge >= 0 ? "#16a34a" : "#ef4444") }}>
          <p style={{ fontSize: "0.7rem", color: marge >= 0 ? "#16a34a" : "#ef4444", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, margin: 0 }}>Marge nette</p>
          <p style={{ fontSize: "1.375rem", fontWeight: 700, margin: "0.2rem 0 0", color: marge >= 0 ? "#16a34a" : "#ef4444" }}>{fmt(marge)}</p>
        </div>
      </div>

      {/* Graphique SVG revenus / charges */}
      <div className="genia-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 1.25rem" }}>Revenus vs Charges — 6 derniers mois</h2>
        <div style={{ overflowX: "auto" }}>
          <svg width={W} height={H + 36} style={{ display: "block" }}>
            {/* Grille */}
            {[0, 0.25, 0.5, 0.75, 1].map(t => (
              <line key={t} x1={0} y1={H * (1 - t)} x2={W} y2={H * (1 - t)} stroke="var(--border)" strokeWidth={1} />
            ))}
            {chartData.map((d, i) => {
              const x = i * colW + GAP / 2;
              const revH = (d.rev / chartMax) * H;
              const expH = (d.exp / chartMax) * H;
              const cx = x + colW / 2;
              return (
                <g key={i}>
                  {/* Barre revenus */}
                  <rect x={cx - BAR_W - 2} y={H - revH} width={BAR_W} height={revH} fill="#22c55e" rx={3} opacity={0.85} />
                  {/* Barre charges */}
                  <rect x={cx + 2} y={H - expH} width={BAR_W} height={expH} fill="#ef4444" rx={3} opacity={0.85} />
                  {/* Label mois */}
                  <text x={cx} y={H + 18} textAnchor="middle" fontSize={11} fill="var(--text-muted)">{d.label}</text>
                  {/* Marge (point) */}
                  {d.rev > 0 || d.exp > 0 ? (
                    <circle cx={cx} cy={H - Math.max(0, (d.margin / chartMax) * H)} r={3} fill={d.margin >= 0 ? "#16a34a" : "#ef4444"} />
                  ) : null}
                </g>
              );
            })}
            {/* Légende */}
            <rect x={0} y={H + 26} width={10} height={10} fill="#22c55e" rx={2} />
            <text x={14} y={H + 35} fontSize={10} fill="var(--text-muted)">Revenus perçus</text>
            <rect x={110} y={H + 26} width={10} height={10} fill="#ef4444" rx={2} />
            <text x={124} y={H + 35} fontSize={10} fill="var(--text-muted)">Charges</text>
            <circle cx={205} cy={H + 31} r={3} fill="#16a34a" />
            <text x={212} y={H + 35} fontSize={10} fill="var(--text-muted)">Marge</text>
          </svg>
        </div>
      </div>

      {/* Pipeline clients */}
      {clientsByStatus.length > 0 && (
        <div className="genia-card" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 1rem" }}>Pipeline clients</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            {(["prospect","verbal","acompte","en_cours","termine","followup","perdu"] as const).map(status => {
              const g = clientsByStatus.find(x => x.status === status);
              if (!g) return null;
              const max = Math.max(...clientsByStatus.map(x => x._count));
              return (
                <div key={status} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.35rem 0" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: STATUS_COLORS[status] || "#888", flexShrink: 0 }} />
                  <span style={{ fontSize: "0.82rem", width: "165px", flexShrink: 0 }}>{STATUS_LABELS[status] || status}</span>
                  <div style={{ flex: 1, background: "var(--border)", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
                    <div style={{ width: (g._count / max * 100) + "%", height: "100%", background: STATUS_COLORS[status] || "#888", borderRadius: "4px" }} />
                  </div>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, width: "20px", textAlign: "right" as const }}>{g._count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
