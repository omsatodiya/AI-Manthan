"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChatComponent } from "@/components/chat/ChatComponent";
import { getSupabaseClient } from "@/lib/database/clients";
import { AuthUser } from "@/lib/types";

interface Conversation {
  id: string;
  userA: {
    id: string;
    fullName: string;
    email: string;
  };
  userB: {
    id: string;
    fullName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  lastMessageId: string | null;
}

interface ChatPageClientProps {
  conversationId: string;
  currentUser: AuthUser;
}

export default function ChatPageClient({
  conversationId,
  currentUser,
}: ChatPageClientProps) {
  const router = useRouter();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch conversation details
  useEffect(() => {
    const fetchConversation = async () => {
      try {
        setIsLoading(true);
        const supabase = await getSupabaseClient();

        const { data: conversation, error: conversationError } = await supabase
          .from("conversations")
          .select(
            `
             id,
             user_a,
             user_b,
             created_at,
             updated_at,
             last_message_id
           `
          )
          .eq("id", conversationId)
          .single();

        if (conversationError || !conversation) {
          console.error("Conversation fetch error:", conversationError);
          throw new Error("Conversation not found");
        }

        // Check if current user is a participant
        if (
          conversation.user_a !== currentUser.id &&
          conversation.user_b !== currentUser.id
        ) {
          throw new Error("Access denied");
        }

        // Fetch user details separately
        const userIds = [conversation.user_a, conversation.user_b];
        const { data: users, error: usersError } = await supabase
          .from("users")
          .select("id, fullName, email")
          .in("id", userIds);

        if (usersError) {
          console.error("Error fetching user details:", usersError);
          throw new Error("Failed to load user details");
        }

        const userA = users?.find((u) => u.id === conversation.user_a);
        const userB = users?.find((u) => u.id === conversation.user_b);

        const transformedConversation: Conversation = {
          id: conversation.id,
          userA: {
            id: conversation.user_a,
            fullName: userA?.fullName || "Unknown User",
            email: userA?.email || "",
          },
          userB: {
            id: conversation.user_b,
            fullName: userB?.fullName || "Unknown User",
            email: userB?.email || "",
          },
          createdAt: conversation.created_at,
          updatedAt: conversation.updated_at,
          lastMessageId: conversation.last_message_id,
        };

        setConversation(transformedConversation);
        setError(null);
      } catch (error) {
        console.error("Error fetching conversation:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load conversation"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversation();
  }, [conversationId, currentUser.id]);

  // Get the other user (not the current user)
  const otherUser = conversation
    ? conversation.userA.id === currentUser.id
      ? conversation.userB
      : conversation.userA
    : null;

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading conversation...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !conversation || !otherUser) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                <h2 className="text-lg font-semibold mb-2">Error</h2>
                <p className="text-muted-foreground mb-4">
                  {error || "Conversation not found"}
                </p>
                <Button onClick={() => router.back()} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
      {/* Back Button */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>
      </div>

      {/* Chat Component */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ChatComponent
          conversationId={conversationId}
          otherUser={otherUser}
          currentUser={currentUser}
        />
      </motion.div>
    </div>
  );
}
