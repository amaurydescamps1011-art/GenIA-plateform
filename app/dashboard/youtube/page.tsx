import { getCurrentUser } from "@/lib/session";
import YoutubeClient from "@/components/YoutubeClient";

export default async function YoutubePage() {
  const user = await getCurrentUser();
  return <YoutubeClient user={user!} />;
}
