import { getCurrentUserAction } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import ChatPageClient from "./ChatPageClient";

// interface Conversation {
//   id: string;
//   userA: {
//     id: string;
//     fullName: string;
//     email: string;
//   };
//   userB: {
//     id: string;
//     fullName: string;
//     email: string;
//   };
//   createdAt: string;
//   updatedAt: string;
//   lastMessageId: string | null;
// }

interface ChatPageProps {
  params: Promise<{
    conversationId: string;
  }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { conversationId } = await params;

  // Get current user on server side
  const currentUser = await getCurrentUserAction();
  if (!currentUser) {
    redirect("/login");
  }

  return (
    <ChatPageClient conversationId={conversationId} currentUser={currentUser} />
  );
}
