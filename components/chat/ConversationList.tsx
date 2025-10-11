"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  MessageCircle,
  Users,
  Clock,
  Loader2,
  RefreshCw,
  Plus,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { getSupabaseClient } from "@/lib/database/clients";
import { getCurrentUserAction } from "@/app/actions/auth";
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
  lastMessage?: {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
  };
}

export function ConversationList() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await getCurrentUserAction();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error fetching current user:", error);
        setError("Failed to load user data");
        setIsLoading(false);
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch conversations
  const fetchConversations = async (showRefreshLoader = false) => {
    if (!currentUser?.id) return;

    try {
      if (showRefreshLoader) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const supabase = await getSupabaseClient();

      // Fetch conversations where user is a participant
      const { data: conversationsData, error: conversationsError } =
        await supabase
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
          .or(`user_a.eq.${currentUser.id},user_b.eq.${currentUser.id}`)
          .order("updated_at", { ascending: false });

      if (conversationsError) {
        console.error("Supabase conversations error:", conversationsError);
        throw new Error(
          `Database error: ${conversationsError.message || "Unknown error"}`
        );
      }

      // Get unique user IDs from conversations
      const userIds = new Set<string>();
      conversationsData?.forEach((conv) => {
        userIds.add(conv.user_a);
        userIds.add(conv.user_b);
      });

      // Fetch user details separately
      let usersData: any[] = [];
      if (userIds.size > 0) {
        const { data: users, error: usersError } = await supabase
          .from("users")
          .select("id, fullName, email")
          .in("id", Array.from(userIds));

        if (usersError) {
          console.error("Error fetching user details:", usersError);
        } else {
          usersData = users || [];
        }
      }

      // Fetch last messages for each conversation
      const conversationIds = conversationsData?.map((c) => c.id) || [];
      let lastMessages: any[] = [];

      if (conversationIds.length > 0) {
        const { data: messagesData, error: messagesError } = await supabase
          .from("messages")
          .select("id, conversation_id, content, created_at, sender_id")
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: false });

        if (messagesError) {
          console.error("Error fetching last messages:", messagesError);
        } else {
          lastMessages = messagesData || [];
        }
      }

      // Transform conversations
      const transformedConversations: Conversation[] = (
        conversationsData || []
      ).map((conv) => {
        const userA = usersData.find((u) => u.id === conv.user_a);
        const userB = usersData.find((u) => u.id === conv.user_b);
        const lastMessage = lastMessages.find(
          (msg) => msg.conversation_id === conv.id
        );

        return {
          id: conv.id,
          userA: {
            id: conv.user_a,
            fullName: userA?.fullName || "Unknown User",
            email: userA?.email || "",
          },
          userB: {
            id: conv.user_b,
            fullName: userB?.fullName || "Unknown User",
            email: userB?.email || "",
          },
          createdAt: conv.created_at,
          updatedAt: conv.updated_at,
          lastMessageId: conv.last_message_id,
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                content: lastMessage.content,
                createdAt: lastMessage.created_at,
                senderId: lastMessage.sender_id,
              }
            : undefined,
        };
      });

      setConversations(transformedConversations);
      setError(null);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setError("Failed to load conversations");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load conversations when user is available
  useEffect(() => {
    if (currentUser) {
      fetchConversations();
    }
  }, [currentUser]);

  // Setup real-time subscription for conversation updates
  useEffect(() => {
    if (!currentUser) return;

    const setupSubscription = async () => {
      try {
        const supabase = await getSupabaseClient();

        // Subscribe to conversation updates
        const subscription = supabase
          .channel(`conversations:${currentUser.id}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "conversations",
              filter: `user_a=eq.${currentUser.id}`,
            },
            () => {
              fetchConversations(true);
            }
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "conversations",
              filter: `user_b=eq.${currentUser.id}`,
            },
            () => {
              fetchConversations(true);
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(subscription);
        };
      } catch (error) {
        console.error("Error setting up subscription:", error);
      }
    };

    const cleanup = setupSubscription();
    return () => {
      cleanup.then((cleanupFn) => cleanupFn?.());
    };
  }, [currentUser]);

  // Filter conversations based on search term
  const filteredConversations = conversations.filter((conv) => {
    if (!searchTerm) return true;

    const otherUser =
      conv.userA.id === currentUser?.id ? conv.userB : conv.userA;
    const searchLower = searchTerm.toLowerCase();

    return (
      otherUser.fullName.toLowerCase().includes(searchLower) ||
      otherUser.email.toLowerCase().includes(searchLower) ||
      conv.lastMessage?.content.toLowerCase().includes(searchLower)
    );
  });

  // Format time
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 168) {
      // 7 days
      return date.toLocaleDateString("en-US", {
        weekday: "short",
      });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  // Handle conversation click
  const handleConversationClick = (conversationId: string) => {
    router.push(`/chat/${conversationId}`);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchConversations(true);
  };

  if (isLoading) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading conversations...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Conversations
            <Badge variant="secondary">{filteredConversations.length}</Badge>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Search */}
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Separator />

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  {searchTerm
                    ? "No conversations found"
                    : "No conversations yet"}
                </p>
                {!searchTerm && (
                  <p className="text-sm mt-2">
                    Start a conversation with someone you've connected with
                  </p>
                )}
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const otherUser =
                  conversation.userA.id === currentUser?.id
                    ? conversation.userB
                    : conversation.userA;

                return (
                  <motion.div
                    key={conversation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleConversationClick(conversation.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold truncate">
                                {otherUser.fullName}
                              </h3>
                              {conversation.lastMessage && (
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(
                                    conversation.lastMessage.createdAt
                                  )}
                                </span>
                              )}
                            </div>

                            {conversation.lastMessage ? (
                              <p className="text-sm text-muted-foreground truncate">
                                {conversation.lastMessage.senderId ===
                                currentUser?.id
                                  ? "You: "
                                  : ""}
                                {conversation.lastMessage.content}
                              </p>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No messages yet
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
