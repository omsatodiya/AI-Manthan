"use client";

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";

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
  isPending?: boolean;
}

interface PaginationState {
  limit: number;
  before: string | null;
  nextCursor: string | null;
  hasMore: boolean;
}

interface UseMessagePaginationProps {
  conversationId: string;
  initialLimit?: number;
}

export function useMessagePagination({
  conversationId,
  initialLimit = 40,
}: UseMessagePaginationProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    limit: initialLimit,
    before: null,
    nextCursor: null,
    hasMore: true,
  });

  const isLoadingRef = useRef(false);

  // Fetch messages from API
  const fetchMessages = useCallback(
    async (
      conversationId: string,
      limit: number = initialLimit,
      before: string | null = null
    ) => {
      try {
        const params = new URLSearchParams({
          conversationId,
          limit: limit.toString(),
        });

        if (before) {
          params.append("before", before);
        }

        const response = await fetch(`/api/messages?${params}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch messages");
        }

        return {
          messages: data.messages,
          pagination: data.pagination,
        };
      } catch (error) {
        console.error("Error fetching messages:", error);
        throw error;
      }
    },
    [initialLimit]
  );

  // Load initial messages
  const loadInitialMessages = useCallback(async () => {
    if (isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);

      const { messages, pagination: paginationData } = await fetchMessages(
        conversationId,
        initialLimit
      );

      // Sort messages by creation time (oldest first for display)
      const sortedMessages = messages.sort(
        (a: Message, b: Message) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setMessages(sortedMessages);
      setPagination(paginationData);
    } catch (error) {
      console.error("Error loading initial messages:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load messages"
      );
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [conversationId, initialLimit, fetchMessages]);

  // Load more messages (older messages)
  const loadMoreMessages = useCallback(async () => {
    if (
      !pagination.nextCursor ||
      isLoadingMore ||
      !pagination.hasMore ||
      isLoadingRef.current
    ) {
      return;
    }

    try {
      setIsLoadingMore(true);
      isLoadingRef.current = true;

      const { messages: newMessages, pagination: paginationData } =
        await fetchMessages(
          conversationId,
          20, // Load fewer messages for pagination
          pagination.nextCursor
        );

      // Prepend older messages to the beginning and sort chronologically
      setMessages((prev) => {
        const combined = [...newMessages, ...prev];
        return combined.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
      setPagination(paginationData);
    } catch (error) {
      console.error("Error loading more messages:", error);
      toast.error("Failed to load more messages");
    } finally {
      setIsLoadingMore(false);
      isLoadingRef.current = false;
    }
  }, [
    conversationId,
    pagination.nextCursor,
    pagination.hasMore,
    isLoadingMore,
    fetchMessages,
  ]);

  // Add new message (for real-time updates)
  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      // Check if message already exists
      const exists = prev.some((msg) => msg.id === message.id);
      if (exists) return prev;

      // Add message and sort chronologically
      const updated = [...prev, message];
      return updated.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });
  }, []);

  // Update message (for optimistic UI)
  const updateMessage = useCallback(
    (messageId: string, updates: Partial<Message>) => {
      setMessages((prev) => {
        const updated = prev.map((msg) =>
          msg.id === messageId ? { ...msg, ...updates } : msg
        );
        // Sort after update to maintain chronological order
        return updated.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
    },
    []
  );

  // Remove message (for failed sends)
  const removeMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  }, []);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch("/api/messages/read", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
        }),
      });

      if (response.ok) {
        // Update local state to reflect read status
        setMessages((prev) => {
          const updated = prev.map((msg) => ({
            ...msg,
            readBy: msg.readBy.includes(msg.senderId)
              ? msg.readBy
              : [...msg.readBy, msg.senderId],
            isRead: true,
          }));
          // Sort after update to maintain chronological order
          return updated.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }, []);

  // Reset pagination state
  const reset = useCallback(() => {
    setMessages([]);
    setPagination({
      limit: initialLimit,
      before: null,
      nextCursor: null,
      hasMore: true,
    });
    setError(null);
    setIsLoading(false);
    setIsLoadingMore(false);
    isLoadingRef.current = false;
  }, [initialLimit]);

  return {
    // State
    messages,
    isLoading,
    isLoadingMore,
    error,
    pagination,

    // Actions
    loadInitialMessages,
    loadMoreMessages,
    addMessage,
    updateMessage,
    removeMessage,
    markMessagesAsRead,
    reset,

    // Computed
    hasMore: pagination.hasMore,
    nextCursor: pagination.nextCursor,
  };
}
