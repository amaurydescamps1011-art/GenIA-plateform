"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { label: "Dashboard",    href: "/dashboard",                icon: "⊞", adminOnly: true },
  { label: "Médiathèque",  href: "/dashboard/mediatheque",   icon: "🗂" },
  { label: "CRM",          href: "/dashboard/crm",            icon: "◉" },
  { label: "SOP",          href: "/dashboard/sop",            icon: "◎" },
  { label: "Tâches",       href: "/dashboard/todos",          icon: "✓" },
  { label: "Facturation",  href: "/dashboard/invoices",       icon: "◻", adminOnly: true },
  { label: "Portfolio",    href: "/dashboard/portfolio",      icon: "◫" },
  { label: "Social Media", href: "/dashboard/social",         icon: "◈" },
  { label: "Compta",       href: "/dashboard/compta",         icon: "◑", adminOnly: true },
  { label: "YouTube Audio",href: "/dashboard/youtube",        icon: "▶" },
];

export default function Sidebar({ user }: { user: { name?: string | null; email: string; role: string } }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside style={{
      position: "fixed",
      left: 0, top: 0, bottom: 0,
      width: "220px",
      background: "var(--surface)",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)" }}>
        <span style={{ fontSize: "1.35rem", fontWeight: 900, letterSpacing: "0.03em", color: "#f6f5f6", userSelect: "none" }}>
          Gen<span style={{ color: "var(--accent)" }}>IA</span>
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "1rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {NAV.filter(item => !item.adminOnly || user.role === "admin").map(item => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              padding: "0.5rem 0.75rem",
              paddingLeft: active ? "0.625rem" : "0.75rem",
              borderRadius: "6px",
              fontSize: "0.875rem",
              fontWeight: active ? 600 : 400,
              color: active ? "var(--text)" : "var(--text-muted)",
              background: active ? "var(--accent-dim)" : "transparent",
              borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
              textDecoration: "none",
              transition: "all 0.15s",
            }}>
              <span style={{ fontSize: "1rem", opacity: active ? 1 : 0.7 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding: "1rem", borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.75rem" }}>
          <div style={{
            width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0,
            background: user.role === "admin" ? "var(--accent)" : "#f59e0b",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.75rem", fontWeight: 700, color: "#fff",
          }}>
            {(user.name || user.email).charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: "hidden" }}>
            <p style={{ fontSize: "0.8rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{user.name || user.email}</p>
            <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>{user.role}</p>
          </div>
        </div>
        <button onClick={logout} className="genia-btn genia-btn-ghost" style={{ width: "100%", fontSize: "0.8rem" }}>
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
