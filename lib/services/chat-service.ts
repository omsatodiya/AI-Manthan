import { createClient as createBrowserClient } from "@supabase/supabase-js";
import type {
  ChatMessageWithUser,
  MessageAttachment,
  UploadFileParams,
  Reaction,
  ReactionGroup,
  ReactionType,
} from "@/lib/types/chat";
import { isMessageEdited } from "@/lib/utils/chat-utils";

// Type definitions for Supabase responses
interface SupabaseMessageData {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  tenant_id?: string | null;
  attachment_id?: string;
  attachment_name?: string;
  attachment_size?: number;
  attachment_type?: string;
  attachment_url?: string;
  users?: {
    id: string;
    full_name?: string;
    fullName?: string;
  };
}

interface SupabaseReactionData {
  id: string;
  message_id: string;
  user_id: string;
  reaction_type: string;
  created_at: string;
  users?: {
    id: string;
    full_name?: string;
    fullName?: string;
  };
}

export class ChatService {
  private supabase: ReturnType<typeof createBrowserClient>;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration for Chat Service");
    }

    this.supabase = createBrowserClient(supabaseUrl, supabaseKey);
  }

  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile({
    file,
    userId,
    tenantId,
  }: UploadFileParams): Promise<MessageAttachment> {
    try {
      // Create unique file path
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const bucket = "chat-attachments";
      const folderPath = tenantId ? `tenant-${tenantId}` : "global";
      const filePath = `${folderPath}/${userId}/${timestamp}_${sanitizedFileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } =
        await this.supabase.storage.from(bucket).upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Failed to upload file:", uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      const attachment: MessageAttachment = {
        id: uploadData.path,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileUrl: urlData.publicUrl,
      };

      return attachment;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  }

  /**
   * Create a message with file attachment
   */
  async createMessageWithAttachment(
    userId: string,
    content: string,
    username: string,
    attachment: MessageAttachment,
    tenantId?: string | null
  ): Promise<ChatMessageWithUser> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.supabase as any)
      .from("chat_messages")
      .insert({
        user_id: userId,
        content: content || `Sent ${attachment.fileName}`,
        tenant_id: tenantId || null,
        attachment_id: attachment.id,
        attachment_name: attachment.fileName,
        attachment_size: attachment.fileSize,
        attachment_type: attachment.fileType,
        attachment_url: attachment.fileUrl,
      })
      .select(
        `
        id,
        content,
        created_at,
        updated_at,
        user_id,
        tenant_id,
        attachment_id,
        attachment_name,
        attachment_size,
        attachment_type,
        attachment_url,
        users (
          id,
          full_name
        )
      `
      )
      .single();

    if (error) {
      console.error("Failed to insert message with attachment:", error);
      throw error;
    }

    const messageData = data as SupabaseMessageData;
    return {
      id: messageData.id,
      content: messageData.content,
      user: {
        id: messageData.user_id,
        name: messageData.users?.full_name ?? messageData.users?.fullName ?? username,
      },
      createdAt: messageData.created_at,
      updatedAt: messageData.updated_at,
      isEdited: false,
      attachment: messageData.attachment_id
        ? {
            id: messageData.attachment_id,
            fileName: messageData.attachment_name || "",
            fileSize: messageData.attachment_size || 0,
            fileType: messageData.attachment_type || "",
            fileUrl: messageData.attachment_url || "",
          }
        : null,
    };
  }

  /**
   * Group reactions by type for a message
   */
  private groupReactions(
    reactions: Reaction[],
    currentUserId: string
  ): ReactionGroup[] {
    const groups = new Map<ReactionType, ReactionGroup>();

    reactions.forEach((reaction) => {
      const existing = groups.get(reaction.reactionType);
      if (existing) {
        existing.count++;
        existing.users.push({ id: reaction.userId, name: reaction.userName });
        if (reaction.userId === currentUserId) {
          existing.hasUserReacted = true;
        }
      } else {
        groups.set(reaction.reactionType, {
          type: reaction.reactionType,
          count: 1,
          users: [{ id: reaction.userId, name: reaction.userName }],
          hasUserReacted: reaction.userId === currentUserId,
        });
      }
    });

    return Array.from(groups.values());
  }

  /**
   * Fetch reactions for messages
   */
  async fetchReactions(
    messageIds: string[],
    currentUserId: string
  ): Promise<Map<string, ReactionGroup[]>> {
    if (messageIds.length === 0) return new Map();

    try {
      const { data, error } = await this.supabase
        .from("chat_reactions")
        .select(
          `
          id,
          message_id,
          user_id,
          reaction_type,
          created_at,
          users (
            id,
            full_name
          )
        `
        )
        .in("message_id", messageIds);

      if (error) throw error;

      const reactionsByMessage = new Map<string, Reaction[]>();

      data?.forEach((row: SupabaseReactionData) => {
        const reaction: Reaction = {
          id: row.id,
          messageId: row.message_id,
          userId: row.user_id,
          userName: row.users?.full_name ?? row.users?.fullName ?? "Unknown User",
          reactionType: row.reaction_type as ReactionType,
          createdAt: row.created_at,
        };

        const existing = reactionsByMessage.get(row.message_id) || [];
        existing.push(reaction);
        reactionsByMessage.set(row.message_id, existing);
      });

      // Group reactions for each message
      const groupedReactions = new Map<string, ReactionGroup[]>();
      reactionsByMessage.forEach((reactions, messageId) => {
        groupedReactions.set(
          messageId,
          this.groupReactions(reactions, currentUserId)
        );
      });

      return groupedReactions;
    } catch (error) {
      console.error("Error fetching reactions:", error);
      return new Map();
    }
  }

  /**
   * Add or update a reaction to a message
   * If user already has a different reaction, it will be replaced
   */
  async addReaction(
    messageId: string,
    userId: string,
    userName: string,
    reactionType: ReactionType,
    tenantId?: string | null
  ): Promise<{ reaction: Reaction; replacedReactionType?: ReactionType }> {
    // First, check if user already has a reaction on this message
    const { data: existingReactions, error: fetchError } = await this.supabase
      .from("chat_reactions")
      .select("id, reaction_type")
      .eq("message_id", messageId)
      .eq("user_id", userId);

    if (fetchError) {
      console.error("Failed to fetch existing reactions:", fetchError);
      throw fetchError;
    }

    let replacedReactionType: ReactionType | undefined;

    // If user already has a reaction, delete it first
    if (existingReactions && existingReactions.length > 0) {
      const existingReaction = existingReactions[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      replacedReactionType = (existingReaction as any)
        .reaction_type as ReactionType;

      // If it's the same reaction type, don't do anything (this shouldn't happen in UI)
      if (replacedReactionType === reactionType) {
        return {
          reaction: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            id: (existingReaction as any).id,
            messageId,
            userId,
            userName,
            reactionType,
            createdAt: new Date().toISOString(),
          },
        };
      }

      // Delete the old reaction
      const { error: deleteError } = await this.supabase
        .from("chat_reactions")
        .delete()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .eq("id", (existingReaction as any).id);

      if (deleteError) {
        console.error("Failed to delete old reaction:", deleteError);
        throw deleteError;
      }
    }

    // Add the new reaction
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.supabase as any)
      .from("chat_reactions")
      .insert({
        message_id: messageId,
        user_id: userId,
        reaction_type: reactionType,
        tenant_id: tenantId || null,
      })
      .select(
        `
        id,
        message_id,
        user_id,
        reaction_type,
        created_at,
        users (
          id,
          full_name
        )
      `
      )
      .single();

    if (error) {
      console.error("Failed to add reaction:", error);
      throw error;
    }

    const reactionData = data as SupabaseReactionData;
    return {
      reaction: {
        id: reactionData.id,
        messageId: reactionData.message_id,
        userId: reactionData.user_id,
        userName: reactionData.users?.full_name ?? reactionData.users?.fullName ?? 'Unknown User',
        reactionType: reactionData.reaction_type as ReactionType,
        createdAt: reactionData.created_at,
      },
      replacedReactionType,
    };
  }

  /**
   * Remove a reaction from a message
   */
  async removeReaction(
    messageId: string,
    userId: string,
    reactionType: ReactionType
  ): Promise<void> {
    const { error } = await this.supabase
      .from("chat_reactions")
      .delete()
      .eq("message_id", messageId)
      .eq("user_id", userId)
      .eq("reaction_type", reactionType);

    if (error) {
      console.error("Failed to remove reaction:", error);
      throw error;
    }
  }

  /**
   * Fetch all messages for a specific tenant or global chat
   */
  async fetchMessages(
    tenantId?: string | null
  ): Promise<ChatMessageWithUser[]> {
    try {
      let query = this.supabase
        .from("chat_messages")
        .select(
          `
          id,
          content,
          created_at,
          updated_at,
          user_id,
          tenant_id,
          attachment_id,
          attachment_name,
          attachment_size,
          attachment_type,
          attachment_url,
          users (
            id,
            full_name
          )
        `
        )
        .order("created_at", { ascending: true });

      // Filter by tenant_id if provided, otherwise show global messages
      if (tenantId) {
        query = query.eq("tenant_id", tenantId);
      } else {
        query = query.is("tenant_id", null);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Failed to fetch chat messages:", error);
        throw error;
      }

      if (!data) return [];

      // Fetch reactions for all messages - note: we need currentUserId here
      // For now, we'll fetch reactions separately in the hook
      const messages: ChatMessageWithUser[] = data.map(
        (row: SupabaseMessageData) => ({
          id: row.id,
          content: row.content,
          user: {
            id: row.user_id,
            name: row.users?.full_name ?? row.users?.fullName ?? "Unknown User",
          },
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          isEdited: isMessageEdited(row.created_at, row.updated_at),
          attachment: row.attachment_id
            ? {
                id: row.attachment_id,
                fileName: row.attachment_name || "",
                fileSize: row.attachment_size || 0,
                fileType: row.attachment_type || "",
                fileUrl: row.attachment_url || "",
              }
            : null,
          reactions: [], // Will be populated by the hook
        })
      );

      return messages;
    } catch (err) {
      console.error("Error fetching messages", err);
      throw err;
    }
  }

  /**
   * Insert a new message into the database
   */
  async createMessage(
    userId: string,
    content: string,
    username: string,
    tenantId?: string | null
  ): Promise<ChatMessageWithUser> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.supabase as any)
      .from("chat_messages")
      .insert({
        user_id: userId,
        content,
        tenant_id: tenantId || null,
      })
      .select(
        `
        id,
        content,
        created_at,
        updated_at,
        user_id,
        tenant_id,
        users (
          id,
          full_name
        )
      `
      )
      .single();

    if (error) {
      console.error("Failed to insert message:", error);
      throw error;
    }
    const messageData = data as SupabaseMessageData;
    return {
      id: messageData.id,
      content: messageData.content,
      user: {
        id: messageData.user_id,
        name: messageData.users?.full_name ?? messageData.users?.fullName ?? username,
      },
      createdAt: messageData.created_at,
      updatedAt: messageData.updated_at,
      isEdited: false,
    };
  }

  /**
   * Delete a file from Supabase Storage
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const bucket = "chat-attachments";

      const { error } = await this.supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        console.error("Failed to delete file from storage:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      throw error;
    }
  }

  /**
   * Delete a message (only by the owner) and its attachment if exists
   */
  async deleteMessage(
    messageId: string,
    userId: string
  ): Promise<string | null> {
    // First, fetch the message to get attachment info
    const { data: messageData, error: fetchError } = await this.supabase
      .from("chat_messages")
      .select("attachment_id, attachment_url")
      .eq("id", messageId)
      .eq("user_id", userId)
      .single();

    if (fetchError) {
      console.error("Failed to fetch message for deletion:", fetchError);
      throw fetchError;
    }

    // Delete the message from database
    const { error: deleteError } = await this.supabase
      .from("chat_messages")
      .delete()
      .eq("id", messageId)
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Failed to delete message:", deleteError);
      throw deleteError;
    }

    // If message had an attachment, delete the file from storage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((messageData as any)?.attachment_id) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await this.deleteFile((messageData as any).attachment_id);
      } catch (error) {
        // Log error but don't fail the operation if file deletion fails
        console.error(
          "Failed to delete attachment file, but message was deleted:",
          error
        );
      }
    }

    // Return the attachment_id if it existed (for cleanup purposes)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (messageData as any)?.attachment_id || null;
  }

  /**
   * Update a message (only by the owner)
   */
  async updateMessage(
    messageId: string,
    userId: string,
    content: string
  ): Promise<ChatMessageWithUser> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.supabase as any)
      .from("chat_messages")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", messageId)
      .eq("user_id", userId) // Ensure only the owner can edit
      .select(
        `
        id,
        content,
        created_at,
        updated_at,
        user_id,
        tenant_id,
        users (
          id,
          full_name
        )
      `
      )
      .single();

    if (error) {
      console.error("Failed to update message:", error);
      throw error;
    }

    const messageData = data as SupabaseMessageData;
    return {
      id: messageData.id,
      content: messageData.content,
      user: {
        id: messageData.user_id,
        name: messageData.users?.full_name ?? messageData.users?.fullName ?? "Unknown User",
      },
      createdAt: messageData.created_at,
      updatedAt: messageData.updated_at,
      isEdited: isMessageEdited(messageData.created_at, messageData.updated_at),
    };
  }
}

// Export a singleton instance
// Lazy initialization to avoid SSR issues
let _chatService: ChatService | null = null;

// Create a properly typed proxy for the ChatService
export const chatService = {
  get instance() {
    if (!_chatService) {
      _chatService = new ChatService();
    }
    return _chatService;
  },

  // Proxy all methods to the lazy instance with proper typing
  async uploadFile(
    params: UploadFileParams
  ): Promise<MessageAttachment> {
    return this.instance.uploadFile(params);
  },

  async fetchMessages(
    tenantId?: string | null
  ): Promise<ChatMessageWithUser[]> {
    return this.instance.fetchMessages(tenantId);
  },

  async createMessage(
    content: string,
    userId: string,
    tenantId?: string | null
  ): Promise<ChatMessageWithUser | null> {
    return this.instance.createMessage(userId, content, '', tenantId);
  },

  async createMessageWithAttachment(
    content: string,
    userId: string,
    attachment: MessageAttachment,
    tenantId?: string | null
  ): Promise<ChatMessageWithUser | null> {
    return this.instance.createMessageWithAttachment(
      userId,
      content,
      '',
      attachment,
      tenantId
    );
  },

  async updateMessage(
    messageId: string,
    content: string,
    userId: string
  ): Promise<ChatMessageWithUser | null> {
    return this.instance.updateMessage(messageId, content, userId);
  },

  async deleteMessage(messageId: string, userId: string): Promise<string | null> {
    return this.instance.deleteMessage(messageId, userId);
  },

  async addReaction(
    messageId: string,
    userId: string,
    reactionType: ReactionType
  ): Promise<{ reaction: Reaction; replacedReactionType?: ReactionType }> {
    return this.instance.addReaction(messageId, userId, "", reactionType);
  },

  async removeReaction(
    messageId: string,
    userId: string,
    reactionType: ReactionType
  ): Promise<void> {
    return this.instance.removeReaction(messageId, userId, reactionType);
  },

  async fetchReactions(
    messageIds: string[],
    userId: string
  ): Promise<Map<string, ReactionGroup[]>> {
    return this.instance.fetchReactions(messageIds, userId);
  },
};
