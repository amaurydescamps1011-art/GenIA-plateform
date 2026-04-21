import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import ExpensesClient from "@/components/ExpensesClient";

export default async function ComptaPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/dashboard/crm");
  return <ExpensesClient />;
}
