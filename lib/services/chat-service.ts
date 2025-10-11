import { createClient as createBrowserClient } from '@supabase/supabase-js'
import type { ChatMessageWithUser, MessageAttachment, UploadFileParams, Reaction, ReactionGroup, ReactionType } from '@/lib/types/chat'
import { isMessageEdited } from '@/lib/utils/chat-utils'

export class ChatService {
  private supabase: ReturnType<typeof createBrowserClient>

  constructor() {
    this.supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
    )
  }

  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile({ file, userId, tenantId }: UploadFileParams): Promise<MessageAttachment> {
    try {
      // Create unique file path
      const timestamp = Date.now()
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const bucket = 'chat-attachments'
      const folderPath = tenantId ? `tenant-${tenantId}` : 'global'
      const filePath = `${folderPath}/${userId}/${timestamp}_${sanitizedFileName}`

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error('Failed to upload file:', uploadError)
        throw uploadError
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      const attachment: MessageAttachment = {
        id: uploadData.path,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileUrl: urlData.publicUrl,
      }

      return attachment
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
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
    const { data, error } = await this.supabase
      .from('chat_messages')
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
      .select(`
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
        users!chat_messages_user_id_fkey (
          id,
          fullName
        )
      `)
      .single()

    if (error) {
      console.error('Failed to insert message with attachment:', error)
      throw error
    }

    return {
      id: data.id,
      content: data.content,
      user: {
        id: data.user_id,
        name: (data.users as any)?.[0]?.fullName || (data.users as any)?.fullName || username,
      },
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      isEdited: false,
      attachment: data.attachment_id
        ? {
            id: data.attachment_id,
            fileName: data.attachment_name,
            fileSize: data.attachment_size,
            fileType: data.attachment_type,
            fileUrl: data.attachment_url,
          }
        : null,
    }
  }

  /**
   * Group reactions by type for a message
   */
  private groupReactions(reactions: Reaction[], currentUserId: string): ReactionGroup[] {
    const groups = new Map<ReactionType, ReactionGroup>()

    reactions.forEach((reaction) => {
      const existing = groups.get(reaction.reactionType)
      if (existing) {
        existing.count++
        existing.users.push({ id: reaction.userId, name: reaction.userName })
        if (reaction.userId === currentUserId) {
          existing.hasUserReacted = true
        }
      } else {
        groups.set(reaction.reactionType, {
          type: reaction.reactionType,
          count: 1,
          users: [{ id: reaction.userId, name: reaction.userName }],
          hasUserReacted: reaction.userId === currentUserId,
        })
      }
    })

    return Array.from(groups.values())
  }

  /**
   * Fetch reactions for messages
   */
  async fetchReactions(messageIds: string[], currentUserId: string): Promise<Map<string, ReactionGroup[]>> {
    if (messageIds.length === 0) return new Map()

    try {
      const { data, error } = await this.supabase
        .from('chat_reactions')
        .select(`
          id,
          message_id,
          user_id,
          reaction_type,
          created_at,
          users!chat_reactions_user_id_fkey (
            id,
            fullName
          )
        `)
        .in('message_id', messageIds)

      if (error) throw error

      const reactionsByMessage = new Map<string, Reaction[]>()

      data?.forEach((row: any) => {
        const reaction: Reaction = {
          id: row.id,
          messageId: row.message_id,
          userId: row.user_id,
          userName: row.users?.fullName || 'Unknown User',
          reactionType: row.reaction_type,
          createdAt: row.created_at,
        }

        const existing = reactionsByMessage.get(row.message_id) || []
        existing.push(reaction)
        reactionsByMessage.set(row.message_id, existing)
      })

      // Group reactions for each message
      const groupedReactions = new Map<string, ReactionGroup[]>()
      reactionsByMessage.forEach((reactions, messageId) => {
        groupedReactions.set(messageId, this.groupReactions(reactions, currentUserId))
      })

      return groupedReactions
    } catch (error) {
      console.error('Error fetching reactions:', error)
      return new Map()
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
      .from('chat_reactions')
      .select('id, reaction_type')
      .eq('message_id', messageId)
      .eq('user_id', userId)

    if (fetchError) {
      console.error('Failed to fetch existing reactions:', fetchError)
      throw fetchError
    }

    let replacedReactionType: ReactionType | undefined

    // If user already has a reaction, delete it first
    if (existingReactions && existingReactions.length > 0) {
      const existingReaction = existingReactions[0]
      replacedReactionType = existingReaction.reaction_type as ReactionType

      // If it's the same reaction type, don't do anything (this shouldn't happen in UI)
      if (replacedReactionType === reactionType) {
        return {
          reaction: {
            id: existingReaction.id,
            messageId,
            userId,
            userName,
            reactionType,
            createdAt: new Date().toISOString(),
          },
        }
      }

      // Delete the old reaction
      const { error: deleteError } = await this.supabase
        .from('chat_reactions')
        .delete()
        .eq('id', existingReaction.id)

      if (deleteError) {
        console.error('Failed to delete old reaction:', deleteError)
        throw deleteError
      }
    }

    // Add the new reaction
    const { data, error } = await this.supabase
      .from('chat_reactions')
      .insert({
        message_id: messageId,
        user_id: userId,
        reaction_type: reactionType,
        tenant_id: tenantId || null,
      })
      .select(`
        id,
        message_id,
        user_id,
        reaction_type,
        created_at
      `)
      .single()

    if (error) {
      console.error('Failed to add reaction:', error)
      throw error
    }

    return {
      reaction: {
        id: data.id,
        messageId: data.message_id,
        userId: data.user_id,
        userName,
        reactionType: data.reaction_type,
        createdAt: data.created_at,
      },
      replacedReactionType,
    }
  }

  /**
   * Remove a reaction from a message
   */
  async removeReaction(messageId: string, userId: string, reactionType: ReactionType): Promise<void> {
    const { error } = await this.supabase
      .from('chat_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .eq('reaction_type', reactionType)

    if (error) {
      console.error('Failed to remove reaction:', error)
      throw error
    }
  }

  /**
   * Fetch all messages for a specific tenant or global chat
   */
  async fetchMessages(tenantId?: string | null): Promise<ChatMessageWithUser[]> {
    try {
      let query = this.supabase
        .from('chat_messages')
        .select(`
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
          users!chat_messages_user_id_fkey (
            id,
            fullName
          )
        `)
        .order('created_at', { ascending: true })

      // Filter by tenant_id if provided, otherwise show global messages
      if (tenantId) {
        query = query.eq('tenant_id', tenantId)
      } else {
        query = query.is('tenant_id', null)
      }

      const { data, error } = await query

      if (error) {
        console.error('Failed to fetch chat messages:', error)
        throw error
      }

      if (!data) return []

      const messageIds = data.map((row: any) => row.id)
      
      // Fetch reactions for all messages - note: we need currentUserId here
      // For now, we'll fetch reactions separately in the hook
      const messages: ChatMessageWithUser[] = (data as any[]).map((row) => ({
        id: row.id,
        content: row.content,
        user: {
          id: row.user_id,
          name: row.users?.fullName || 'Unknown User',
        },
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        isEdited: isMessageEdited(row.created_at, row.updated_at),
        attachment: row.attachment_id
          ? {
              id: row.attachment_id,
              fileName: row.attachment_name,
              fileSize: row.attachment_size,
              fileType: row.attachment_type,
              fileUrl: row.attachment_url,
            }
          : null,
        reactions: [], // Will be populated by the hook
      }))

      return messages
    } catch (err) {
      console.error('Error fetching messages', err)
      throw err
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
    const { data, error } = await this.supabase
      .from('chat_messages')
      .insert({
        user_id: userId,
        content,
        tenant_id: tenantId || null,
      })
      .select(`
        id,
        content,
        created_at,
        updated_at,
        user_id,
        tenant_id,
        users!chat_messages_user_id_fkey (
          id,
          fullName
        )
      `)
      .single()

    if (error) {
      console.error('Failed to insert message:', error)
      throw error
    }

    return {
      id: data.id,
      content: data.content,
      user: {
        id: data.user_id,
        name: (data.users as any)?.[0]?.fullName || (data.users as any)?.fullName || username,
      },
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      isEdited: false,
    }
  }

  /**
   * Delete a file from Supabase Storage
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const bucket = 'chat-attachments'
      
      const { error } = await this.supabase.storage
        .from(bucket)
        .remove([filePath])

      if (error) {
        console.error('Failed to delete file from storage:', error)
        throw error
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      throw error
    }
  }

  /**
   * Delete a message (only by the owner) and its attachment if exists
   */
  async deleteMessage(messageId: string, userId: string): Promise<string | null> {
    // First, fetch the message to get attachment info
    const { data: messageData, error: fetchError } = await this.supabase
      .from('chat_messages')
      .select('attachment_id, attachment_url')
      .eq('id', messageId)
      .eq('user_id', userId)
      .single()

    if (fetchError) {
      console.error('Failed to fetch message for deletion:', fetchError)
      throw fetchError
    }

    // Delete the message from database
    const { error: deleteError } = await this.supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId)
      .eq('user_id', userId)

    if (deleteError) {
      console.error('Failed to delete message:', deleteError)
      throw deleteError
    }

    // If message had an attachment, delete the file from storage
    if (messageData?.attachment_id) {
      try {
        await this.deleteFile(messageData.attachment_id)
      } catch (error) {
        // Log error but don't fail the operation if file deletion fails
        console.error('Failed to delete attachment file, but message was deleted:', error)
      }
    }

    // Return the attachment_id if it existed (for cleanup purposes)
    return messageData?.attachment_id || null
  }

  /**
   * Update a message (only by the owner)
   */
  async updateMessage(
    messageId: string,
    userId: string,
    content: string
  ): Promise<ChatMessageWithUser> {
    const { data, error } = await this.supabase
      .from('chat_messages')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('user_id', userId) // Ensure only the owner can edit
      .select(`
        id,
        content,
        created_at,
        updated_at,
        user_id,
        tenant_id,
        users!chat_messages_user_id_fkey (
          id,
          fullName
        )
      `)
      .single()

    if (error) {
      console.error('Failed to update message:', error)
      throw error
    }

    return {
      id: data.id,
      content: data.content,
      user: {
        id: data.user_id,
        name: (data.users as any)?.fullName || 'Unknown User',
      },
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      isEdited: isMessageEdited(data.created_at, data.updated_at),
    }
  }
}

// Export a singleton instance
export const chatService = new ChatService()
