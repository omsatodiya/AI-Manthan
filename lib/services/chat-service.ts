import { createClient as createBrowserClient } from '@supabase/supabase-js'
import type { ChatMessageWithUser } from '@/lib/types/chat'
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

      return (data as any[]).map((row) => ({
        id: row.id,
        content: row.content,
        user: {
          id: row.user_id,
          name: row.users?.fullName || 'Unknown User',
        },
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        isEdited: isMessageEdited(row.created_at, row.updated_at),
      }))
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
   * Delete a message (only by the owner)
   */
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId)
      .eq('user_id', userId) // Ensure only the owner can delete

    if (error) {
      console.error('Failed to delete message:', error)
      throw error
    }
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
