import { getCurrentUserAction } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import ChatPageClient from "./ChatPageClient";

export default async function ChatPage() {
  // Get current user on server side
  const currentUser = await getCurrentUserAction();
  if (!currentUser) {
    redirect("/login");
  }

  return <ChatPageClient currentUser={currentUser} />;
}
