import { getCurrentUser } from "@/lib/session";
import TodoClient from "@/components/TodoClient";

export default async function TodosPage() {
  const user = await getCurrentUser();
  return <TodoClient user={user!} />;
}
