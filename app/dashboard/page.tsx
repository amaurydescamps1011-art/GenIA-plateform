import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const totalAssets = await prisma.asset.count();
  const myAssets = await prisma.asset.count({ where: { uploadedBy: user!.id } });
  const recentAssets = await prisma.asset.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { user: { select: { name: true } } },
  });

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Bonjour, {user?.name || user?.email} 👋</h1>
        <p style={{ color: "var(--text-muted)", marginTop: "0.25rem", fontSize: "0.875rem" }}>Bienvenue sur la plateforme GenIA Studio</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <StatCard label="Assets totaux" value={totalAssets} />
        <StatCard label="Mes uploads" value={myAssets} />
        <StatCard label="Modules actifs" value={1} />
      </div>

      <div className="genia-card" style={{ padding: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Derniers assets ajoutés</h2>
        {recentAssets.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Aucun asset pour le moment.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {recentAssets.map(a => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.625rem 0", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 500 }}>{a.name}</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>par {a.user.name || "Inconnu"} · {a.category}</p>
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{new Date(a.createdAt).toLocaleDateString("fr-FR")}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="genia-card" style={{ padding: "1.25rem" }}>
      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
      <p style={{ fontSize: "2rem", fontWeight: 700, marginTop: "0.25rem" }}>{value}</p>
    </div>
  );
}
