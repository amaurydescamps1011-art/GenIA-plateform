"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const USERS = [
  { name: "Amaury", email: "amaury@genia.internal", initials: "A" },
  { name: "Fabien", email: "fabien@genia.internal", initials: "F" },
];

export default function LoginPage() {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<typeof USERS[0] | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function selectUser(u: typeof USERS[0]) {
    setSelectedUser(u);
    setPassword("");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: selectedUser.email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Mot de passe incorrect"); return; }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: "360px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <span style={{ fontSize: "2.75rem", fontWeight: 900, letterSpacing: "0.03em", color: "#f6f5f6", userSelect: "none" }}>
            Gen<span style={{ color: "var(--accent)" }}>IA</span>
          </span>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>Creative Studio Platform</p>
        </div>
        <div className="genia-card" style={{ padding: "2rem" }}>
          <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 0.875rem" }}>Qui es-tu ?</p>
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
            {USERS.map(u => {
              const active = selectedUser?.email === u.email;
              return (
                <button key={u.email} onClick={() => selectUser(u)}
                  style={{ flex: 1, padding: "0.875rem 0.5rem", borderRadius: "10px", border: "1px solid " + (active ? "var(--accent)" : "var(--border)"), background: active ? "var(--accent-dim)" : "var(--surface)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem", transition: "all 0.15s" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: active ? "var(--accent)" : "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: 700, color: active ? "#fff" : "var(--text-muted)" }}>
                    {u.initials}
                  </div>
                  <span style={{ fontSize: "0.85rem", fontWeight: active ? 700 : 400, color: active ? "var(--accent)" : "var(--text)" }}>{u.name}</span>
                </button>
              );
            })}
          </div>

          {selectedUser && (
            <>
              {error && (
                <div style={{ background: "rgba(255,60,60,0.1)", border: "1px solid rgba(255,60,60,0.3)", color: "#ff6b6b", padding: "0.625rem", borderRadius: "6px", fontSize: "0.875rem", marginBottom: "1rem" }}>
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <input className="genia-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mot de passe" required autoFocus />
                <button className="genia-btn" type="submit" disabled={loading} style={{ width: "100%" }}>
                  {loading ? "..." : `Connexion — ${selectedUser.name}`}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
