import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import MediathequeClient from "@/components/MediathequeClient";

export default async function MediathequePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div style={{ marginLeft: "220px", height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
        <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Médiathèque</h1>
        <p style={{ margin: "0.25rem 0 0", fontSize: "0.78rem", color: "var(--text-muted)" }}>Fichiers partagés entre tous les projets — accessibles par Amaury et Fabien</p>
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <MediathequeClient currentUser={{ id: user.id, name: user.name, email: user.email, role: user.role }} />
      </div>
    </div>
  );
}
