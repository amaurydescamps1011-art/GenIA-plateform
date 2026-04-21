import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const clientCount = await prisma.client.count({ where: { createdBy: user!.id } });
  const todoCount = await prisma.todo.count({ where: { createdBy: user!.id, done: false } });
  const clientsByStatus = await prisma.client.groupBy({
    by: ["status"],
    where: { createdBy: user!.id },
    _count: true,
  });

  const STATUS_LABELS: Record<string, string> = {
    prospect: "Prospect",
    verbal: "Confirmation verbale",
    acompte: "Acompte paye",
    en_cours: "En cours",
    termine: "Termine",
    followup: "Follow-up",
    perdu: "Perdu",
  };
  const STATUS_COLORS: Record<string, string> = {
    prospect: "#eab308",
    verbal: "#f97316",
    acompte: "#22c55e",
    en_cours: "#6366f1",
    termine: "#16a34a",
    followup: "#8b5cf6",
    perdu: "#ef4444",
  };

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Bonjour, {user?.name || user?.email}</h1>
        <p style={{ color: "var(--text-muted)", marginTop: "0.25rem", fontSize: "0.875rem" }}>Plateforme GenIA Studio</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <Link href="/dashboard/crm" style={{ textDecoration: "none" }}>
          <div className="genia-card" style={{ padding: "1.25rem", cursor: "pointer" }}>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Clients</p>
            <p style={{ fontSize: "2rem", fontWeight: 700, marginTop: "0.25rem", color: "var(--text)" }}>{clientCount}</p>
          </div>
        </Link>
        <Link href="/dashboard/todos" style={{ textDecoration: "none" }}>
          <div className="genia-card" style={{ padding: "1.25rem", cursor: "pointer" }}>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Taches a faire</p>
            <p style={{ fontSize: "2rem", fontWeight: 700, marginTop: "0.25rem", color: todoCount > 0 ? "#f97316" : "var(--text)" }}>{todoCount}</p>
          </div>
        </Link>
      </div>

      {clientsByStatus.length > 0 && (
        <div className="genia-card" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Clients par statut</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {clientsByStatus.map((g) => (
              <div key={g.status} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: STATUS_COLORS[g.status] || "#888", flexShrink: 0 }} />
                <span style={{ fontSize: "0.875rem", flex: 1 }}>{STATUS_LABELS[g.status] || g.status}</span>
                <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{g._count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
