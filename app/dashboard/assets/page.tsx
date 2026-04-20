import { getCurrentUser } from "@/lib/session";
import AssetsClient from "@/components/AssetsClient";

export default async function AssetsPage() {
  const user = await getCurrentUser();
  return <AssetsClient currentUser={user!} />;
}
