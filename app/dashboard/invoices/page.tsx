import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import InvoicesClient from "@/components/InvoicesClient";

export default async function InvoicesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/dashboard/crm");
  return <InvoicesClient />;
}
