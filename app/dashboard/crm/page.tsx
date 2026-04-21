import { getCurrentUser } from "@/lib/session";
import CRMClient from "@/components/CRMClient";

export default async function CRMPage() {
  const user = await getCurrentUser();
  return <CRMClient user={user!} />;
}
