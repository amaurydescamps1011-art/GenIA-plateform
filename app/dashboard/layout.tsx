import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar user={user} />
      <main style={{ flex: 1, marginLeft: "220px", padding: "2rem", overflowY: "auto" }}>
        {children}
      </main>
    </div>
  );
}
