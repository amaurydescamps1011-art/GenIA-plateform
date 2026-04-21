"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { label: "Dashboard", href: "/dashboard", icon: "⊞" },
  { label: "Assets", href: "/dashboard/assets", icon: "◈" },
  { label: "CRM", href: "/dashboard/crm", icon: "◉" },
  { label: "SOP", href: "/dashboard/sop", icon: "◎" },
  { label: "Taches", href: "/dashboard/todos", icon: "✓" },
  { label: "Facturation", href: "/dashboard/invoices", icon: "◻" },
  { label: "YouTube Audio", href: "/dashboard/youtube", icon: "▶" },
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
        <svg viewBox="0 0 843 288" height="28" style={{ display: "block" }}>
          <path fillRule="evenodd" fill="#f6f5f6" d="m155.25 26.07c72.96-0.06 91.67 0.19 91.38 1.18-0.2 0.69-4.76 8-10.13 16.25-5.37 8.25-11.06 16.69-15.5 22.5h-69c-54.73 0-69.67 0.27-72.25 1.32-1.82 0.73-4.35 3.04-8.25 9.18v42.5c0 41.09 0.07 42.62 2.06 46 1.13 1.93 3.6 4.53 8.94 8.06l43.5-0.02c26.15-0.01 45.69-0.44 49-1.07 3.03-0.58 6.33-1.82 7.35-2.76 1.02-0.94 2.45-2.84 3.18-4.21 0.75-1.44 1.45-6.83 1.64-12.71 0.28-8.74 0.07-10.46-1.46-12-1.64-1.65-4.7-1.81-38.5-2-20.19-0.12-36.84-0.57-37-1-0.16-0.44 2.94-5.29 6.89-10.79 3.95-5.5 9.37-13.26 16.9-24.5h96l-0.31 36.75c-0.28 32.15-0.55 37.44-2.12 42.25-0.99 3.03-3.04 7.3-4.56 9.5-1.52 2.2-4.72 5.82-7.13 8.05-2.41 2.23-6.4 5.25-8.88 6.7-2.47 1.46-7.2 3.35-10.5 4.2-5.11 1.33-15.02 1.56-67 1.56-51.1 0-61.93-0.24-66.75-1.5-3.16-0.83-7.89-2.6-10.5-3.93-2.61-1.33-6.83-4.59-9.37-7.25-2.55-2.66-5.79-6.86-7.22-9.33-1.42-2.47-3.51-8.1-4.64-12.5-1.93-7.56-2.04-10.89-2.05-60.5-0.01-49.81 0.09-52.85 2.01-59.25 1.12-3.75 3.94-9.52 6.35-13 2.77-3.99 6.56-7.79 10.5-10.5 3.39-2.34 8.31-4.89 10.92-5.68 3.96-1.19 19.96-1.44 96.5-1.5zm417.75-0.07h42.01l-0.26 87.5c-0.14 48.13-0.02 87.52 0.25 87.53 0.27 0.02 1.82-3.47 3.42-7.75 1.61-4.28 6.18-15.66 10.15-25.28 3.97-9.63 10.38-24.7 14.23-33.5 3.86-8.8 9.36-22.3 12.22-30 2.86-7.7 8.46-21.43 12.44-30.5 3.98-9.08 10.01-23.59 19.54-48h62l1.39 2.75c0.76 1.51 5.45 12.87 10.42 25.25 4.96 12.37 10.24 25.2 11.73 28.5 1.48 3.3 5.51 12.75 8.96 21 3.44 8.25 10.64 24.9 15.99 37 5.35 12.1 14.19 32.8 19.63 46 5.45 13.2 9.9 24.11 9.89 24.25 0 0.14-9.24 0.25-41.01 0.25l-3.12-6.75c-1.71-3.71-5.81-12.6-9.1-19.75-3.29-7.15-6.28-13.33-6.63-13.74-0.36-0.4-22.02-0.75-48.15-0.77-26.12-0.02-47.79 0.31-48.13 0.73-0.35 0.43-3 6.18-5.89 12.78-2.89 6.6-6.99 15.49-12.98 27.5h-79zm136.5 55c-3.14 6.87-8.14 18.13-11.11 25-2.98 6.87-6.98 15.76-8.9 19.75l-3.49 7.25c49.6 0 64-0.22 64-0.5 0-0.28-2.9-6.91-6.44-14.75-3.54-7.84-10.51-23.03-15.48-33.75-4.97-10.72-9.46-19.65-9.97-19.83-0.52-0.18-1.38 0.72-1.92 2-0.54 1.28-3.55 7.95-6.69 14.83zm-463.33-175.86c42.19 0.24 43.12 0.29 49.5 2.58 3.57 1.28 8.3 3.56 10.5 5.07 2.2 1.5 5.47 4.49 7.27 6.64 1.79 2.15 4.16 6.27 5.25 9.16 1.55 4.11 1.97 7.68 1.95 16.5-0.01 9.22-0.39 12.06-2.09 15.75-1.13 2.47-4.84 7.2-8.23 10.5-3.4 3.3-9.31 7.64-13.16 9.65-3.85 2.01-9.47 4.46-12.49 5.45-4.7 1.53-10.54 1.87-74.5 2.9l-0.32 3.5c-0.17 1.92 0.39 5.41 1.25 7.75 0.87 2.34 2.78 5.03 4.27 6 2.47 1.59 7.03 1.77 102.3 2.25v34l-52.25 0.01c-31.52 0-54.44-0.4-57.75-1.02-3.03-0.56-8.77-2.59-12.75-4.51-4.19-2.01-9.27-5.49-12.01-8.23-2.62-2.62-6.11-7.45-10.74-16.75l-0.32-34c-0.21-23.13 0.06-35.92 0.86-40 0.64-3.3 2.51-8.7 4.16-12 1.65-3.3 5.09-8.18 7.64-10.83 2.56-2.66 6.01-5.55 7.66-6.42 1.65-0.88 4.8-2.18 7-2.89 3.08-1.01 13.82-1.25 47-1.06zm-35.25 41.04c-0.69 2.56-1.25 7.36-1.25 10.66 0 4.87 0.32 6.08 1.75 6.44 0.96 0.24 15.47 0.36 32.25 0.25 26.89-0.17 30.88-0.4 33.75-1.95 1.78-0.96 4.13-3.21 5.21-4.99 1.09-1.79 1.99-4.94 2-7 0.03-2.77-0.73-4.61-2.88-7l-2.92-3.25c-56.69-0.51-63.05-0.3-64.66 0.81-1.1 0.76-2.57 3.48-3.25 6.03zm125.25-41.34h52c32.07 0.01 54.49 0.42 58.5 1.08 3.57 0.58 8.75 2.12 11.5 3.42 2.75 1.29 7.06 4.52 9.58 7.17 2.52 2.66 5.51 6.63 6.65 8.83 1.13 2.2 2.87 6.7 3.87 10 1.46 4.81 1.83 9.56 1.86 24 0.02 9.9-0.08 32.73-0.46 83.5h-38l-0.25-46.75c-0.22-40.96-0.46-47.13-1.88-49.75-0.97-1.79-3.4-3.81-6-4.99-4.02-1.82-6.62-1.98-59.37-2.01l-0.5 103.5h-38z"/>
        </svg>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "1rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {NAV.map(item => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              padding: "0.5rem 0.75rem",
              borderRadius: "6px",
              fontSize: "0.875rem",
              fontWeight: active ? 600 : 400,
              color: active ? "var(--text)" : "var(--text-muted)",
              background: active ? "var(--accent-dim)" : "transparent",
              textDecoration: "none",
              transition: "all 0.15s",
            }}>
              <span style={{ fontSize: "1rem" }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding: "1rem", borderTop: "1px solid var(--border)" }}>
        <div style={{ marginBottom: "0.75rem" }}>
          <p style={{ fontSize: "0.8rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name || user.email}</p>
          <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{user.role}</p>
        </div>
        <button onClick={logout} className="genia-btn genia-btn-ghost" style={{ width: "100%", fontSize: "0.8rem" }}>
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
