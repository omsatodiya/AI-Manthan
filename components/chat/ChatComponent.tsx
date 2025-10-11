"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Send,
  Loader2,
  RefreshCw,
  MessageCircle,
  User,
  Clock,
  Check,
  CheckCheck,
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
import { useMessagePagination } from "@/hooks/use-message-pagination";

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: {
    id: string;
    fullName: string;
    email: string;
  };
  content: string;
  attachments?: any;
  createdAt: string;
  readBy: string[];
  metadata?: any;
  isRead: boolean;
  isPending?: boolean; // For optimistic UI
}

interface ChatComponentProps {
  conversationId: string;
  otherUser: {
    id: string;
    fullName: string;
    email: string;
  };
}

export function ChatComponent({
  conversationId,
  otherUser,
}: ChatComponentProps) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Use the pagination hook
  const {
    messages,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    nextCursor,
    loadInitialMessages,
    loadMoreMessages,
    addMessage,
    updateMessage,
    removeMessage,
    markMessagesAsRead,
  } = useMessagePagination({ conversationId });

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabaseRef = useRef<any>(null);
  const subscriptionRef = useRef<any>(null);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await getCurrentUserAction();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };
    fetchCurrentUser();
  }, []);

  // Initialize Supabase client
  useEffect(() => {
    const initSupabase = async () => {
      try {
        const supabase = await getSupabaseClient();
        supabaseRef.current = supabase;
      } catch (error) {
        console.error("Error initializing Supabase:", error);
      }
    };
    initSupabase();
  }, []);

  // Fetch messages is now handled by the hook

  // Load initial messages
  useEffect(() => {
    if (!conversationId || !currentUser) return;
    loadInitialMessages();
  }, [conversationId, currentUser, loadInitialMessages]);

  // Load more messages is now handled by the hook

  // Send message
  const sendMessage = useCallback(
    async (conversationId: string, content: string) => {
      if (!currentUser || !content.trim()) return;

      const tempId = `temp-${Date.now()}`;
      const optimisticMessage: Message = {
        id: tempId,
        conversationId,
        senderId: currentUser.id,
        sender: {
          id: currentUser.id,
          fullName: currentUser.name,
          email: currentUser.email,
        },
        content: content.trim(),
        createdAt: new Date().toISOString(),
        readBy: [],
        isRead: false,
        isPending: true,
      };

      // Add optimistic message immediately
      addMessage(optimisticMessage);
      setNewMessage("");

      try {
        setIsSending(true);

        const response = await fetch("/api/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversationId,
            content: content.trim(),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to send message");
        }

        // Replace optimistic message with real message
        updateMessage(tempId, { ...data.message, isPending: false });

        toast.success("Message sent!");
      } catch (error) {
        console.error("Error sending message:", error);

        // Remove failed message
        removeMessage(tempId);

        toast.error("Failed to send message. Please try again.");
      } finally {
        setIsSending(false);
      }
    },
    [currentUser]
  );

  // Handle send message
  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || isSending) return;
    sendMessage(conversationId, newMessage);
  }, [newMessage, isSending, sendMessage, conversationId]);

  // Handle key press
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  // Setup real-time subscription
  useEffect(() => {
    if (!supabaseRef.current || !conversationId) return;

    const supabase = supabaseRef.current;

    // Subscribe to new messages
    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload: any) => {
          console.log("New message received:", payload);

          // Fetch the complete message with sender details
          try {
            const { data: message, error } = await supabase
              .from("messages")
              .select(
                `
                 id,
                 conversation_id,
                 sender_id,
                 content,
                 attachments,
                 created_at,
                 read_by,
                 metadata
               `
              )
              .eq("id", payload.new.id)
              .single();

            if (error || !message) {
              console.error("Error fetching new message:", error);
              return;
            }

            // Fetch sender details separately
            const { data: sender, error: senderError } = await supabase
              .from("users")
              .select("id, fullName, email")
              .eq("id", message.sender_id)
              .single();

            if (senderError) {
              console.error("Error fetching sender details:", senderError);
            }

            const newMessage: Message = {
              id: message.id,
              conversationId: message.conversation_id,
              senderId: message.sender_id,
              sender: {
                id: sender?.id || message.sender_id,
                fullName: sender?.fullName || "Unknown User",
                email: sender?.email || "",
              },
              content: message.content,
              attachments: message.attachments,
              createdAt: message.created_at,
              readBy: message.read_by || [],
              metadata: message.metadata,
              isRead: message.read_by?.includes(currentUser?.id || "") || false,
            };

            // Add new message if it's not already in the list
            addMessage(newMessage);
          } catch (error) {
            console.error("Error processing new message:", error);
          }
        }
      )
      .subscribe();

    subscriptionRef.current = subscription;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [conversationId, currentUser]);

  // Auto-scroll to bottom when new messages arrive (only for new messages, not when loading older ones)
  useEffect(() => {
    if (messagesEndRef.current && !isLoadingMore) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoadingMore]);

  // Handle scroll to top for loading more messages
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

      // Load more when scrolled to top (within 100px)
      if (scrollTop < 100 && hasMore && !isLoadingMore && nextCursor) {
        loadMoreMessages();
      }
    },
    [hasMore, isLoadingMore, nextCursor, loadMoreMessages]
  );

  // Mark messages as read is now handled by the hook

  // Mark messages as read when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        markMessagesAsRead(conversationId);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [markMessagesAsRead, conversationId]);

  // Format time
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get read status icon
  const getReadStatusIcon = (message: Message) => {
    if (message.senderId !== currentUser?.id) return null;

    if (message.isPending) {
      return <Clock className="h-3 w-3 text-muted-foreground" />;
    }

    if (message.readBy.length > 1) {
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    }

    return <Check className="h-3 w-3 text-muted-foreground" />;
  };

  if (isLoading) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading messages...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="mt-4"
          >
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
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {otherUser.fullName}
          <Badge variant="secondary" className="ml-auto">
            {messages.length} messages
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <ScrollArea
          className="flex-1 px-6"
          ref={scrollAreaRef}
          onScrollCapture={handleScroll}
        >
          <div className="space-y-4 py-4">
            {/* Load More Indicator */}
            {isLoadingMore && (
              <div className="flex justify-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading older messages...
                </div>
              </div>
            )}

            {/* Messages */}
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${
                    message.senderId === currentUser?.id
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      message.senderId === currentUser?.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    } ${message.isPending ? "opacity-70" : ""}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <p className="text-sm">{message.content}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs opacity-70">
                            {formatTime(message.createdAt)}
                          </span>
                          {getReadStatusIcon(message)}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <Separator />

        {/* Message Input */}
        <div className="p-4">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={isSending}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
              size="icon"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
