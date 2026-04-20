import { cookies } from "next/headers";
import { getSession } from "./auth";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("genia_session")?.value;
  if (!token) return null;
  return getSession(token);
}
