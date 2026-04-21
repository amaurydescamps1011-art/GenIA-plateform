import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const uid = user!.id;

  const [clientCount, todoCount, clientsByStatus, invoices] = await Promise.all([
    prisma.client.count({ where: { createdBy: uid } }),
    prisma.todo.count({ where: { createdBy: uid, done: false } }),
    prisma.client.groupBy({ by: ["status"], where: { createdBy: uid }, _count: true }),
    prisma.invoice.findMany({ where: { createdBy: uid }, select: { type: true, status: true, total: true } }),
  ]);

  const cashCollecte = invoices.filter(i => i.status === "paye").reduce((s, i) => s + i.total, 0);
  const cashContracte = invoices.filter(i => ["acompte", "facture"].includes(i.type) && i.status !== "annule").reduce((s, i) => s + i.total, 0);
  const devisEnAttente = invoices.filter(i => i.type === "devis" && ["brouillon", "envoye"].includes(i.status)).reduce((s, i) => s + i.total, 0);
  const facturesImpayees = invoices.filter(i => ["acompte", "facture"].includes(i.type) && !["paye", "annule"].includes(i.status)).reduce((s, i) => s + i.total, 0);

  function fmt(n: number) {
    return n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " €";
  }

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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
        <Link href="/dashboard/crm" style={{ textDecoration: "none" }}>
          <div className="genia-card" style={{ padding: "1.125rem", cursor: "pointer" }}>
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Clients</p>
            <p style={{ fontSize: "1.875rem", fontWeight: 700, margin: "0.25rem 0 0" }}>{clientCount}</p>
          </div>
        </Link>
        <Link href="/dashboard/todos" style={{ textDecoration: "none" }}>
          <div className="genia-card" style={{ padding: "1.125rem", cursor: "pointer" }}>
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Taches a faire</p>
            <p style={{ fontSize: "1.875rem", fontWeight: 700, margin: "0.25rem 0 0", color: todoCount > 0 ? "#f97316" : "var(--text)" }}>{todoCount}</p>
          </div>
        </Link>
        <Link href="/dashboard/invoices" style={{ textDecoration: "none" }}>
          <div className="genia-card" style={{ padding: "1.125rem", cursor: "pointer" }}>
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Devis en attente</p>
            <p style={{ fontSize: "1.875rem", fontWeight: 700, margin: "0.25rem 0 0", color: devisEnAttente > 0 ? "#6366f1" : "var(--text)" }}>{fmt(devisEnAttente)}</p>
          </div>
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "0.75rem", marginBottom: "2rem" }}>
        <Link href="/dashboard/invoices" style={{ textDecoration: "none" }}>
          <div className="genia-card" style={{ padding: "1.125rem", cursor: "pointer", borderLeft: "4px solid #6366f1" }}>
            <p style={{ fontSize: "0.7rem", color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, margin: 0 }}>Cash contracte</p>
            <p style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.25rem 0 0" }}>{fmt(cashContracte)}</p>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "0.15rem 0 0" }}>acomptes + factures signes</p>
          </div>
        </Link>
        <Link href="/dashboard/invoices" style={{ textDecoration: "none" }}>
          <div className="genia-card" style={{ padding: "1.125rem", cursor: "pointer", borderLeft: "4px solid #22c55e" }}>
            <p style={{ fontSize: "0.7rem", color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, margin: 0 }}>Cash collecte</p>
            <p style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.25rem 0 0" }}>{fmt(cashCollecte)}</p>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "0.15rem 0 0" }}>factures payees</p>
          </div>
        </Link>
        <Link href="/dashboard/invoices" style={{ textDecoration: "none" }}>
          <div className="genia-card" style={{ padding: "1.125rem", cursor: "pointer", borderLeft: "4px solid #f97316" }}>
            <p style={{ fontSize: "0.7rem", color: "#f97316", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, margin: 0 }}>A encaisser</p>
            <p style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.25rem 0 0", color: facturesImpayees > 0 ? "#f97316" : "var(--text)" }}>{fmt(facturesImpayees)}</p>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "0.15rem 0 0" }}>non encore percu</p>
          </div>
        </Link>
      </div>

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
