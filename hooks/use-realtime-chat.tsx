'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient as createBrowserClient } from '@supabase/supabase-js'

interface UseRealtimeChatProps {
  userId: string
  username: string
  tenantId?: string | null  // Add tenantId to scope messages
}

export interface ChatMessage {
  id: string
  content: string
  user: {
    id: string
    name: string
  }
  createdAt: string
}

const EVENT_MESSAGE_TYPE = 'message'
const GLOBAL_CHANNEL_NAME = 'global-chat'  // Single channel for global chatbox

export function useRealtimeChat({ userId, username, tenantId }: UseRealtimeChatProps) {
  // Memoize the Supabase client to prevent recreation on every render
  const supabase = useMemo(() => 
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
    ),
    [] // Empty dependency array - create once
  )
  
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    let isMounted = true

    // Fetch all persisted messages from the chatbox (filtered by tenant)
    const fetchMessages = async () => {
      try {
        let query = supabase
          .from('chat_messages')
          .select(`
            id,
            content,
            created_at,
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
          return
        }

        if (!isMounted || !data) return

        const mapped: ChatMessage[] = (data as any[]).map((row) => ({
          id: row.id,
          content: row.content,
          user: {
            id: row.user_id,
            name: row.users?.fullName || 'Unknown User',
          },
          createdAt: row.created_at,
        }))

        setMessages(mapped)
      } catch (err) {
        console.error('Error fetching messages', err)
      }
    }

    fetchMessages()

    // Create tenant-specific or global channel
    const channelName = tenantId ? `tenant-chat-${tenantId}` : GLOBAL_CHANNEL_NAME
    const newChannel = supabase.channel(channelName)

    newChannel
      .on('broadcast', { event: EVENT_MESSAGE_TYPE }, (payload) => {
        setMessages((current) => [...current, payload.payload as ChatMessage])
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
        }
      })

    setChannel(newChannel)

    return () => {
      isMounted = false
      supabase.removeChannel(newChannel)
    }
  }, [supabase, tenantId]) // Add tenantId to dependencies

  const sendMessage = useCallback(
    async (content: string) => {
      if (!channel || !isConnected) return

      // Insert message into database with tenant_id
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: userId,
          content,
          tenant_id: tenantId || null, // Include tenant_id
        })
        .select(`
          id,
          content,
          created_at,
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
        return
      }

      const message: ChatMessage = {
        id: data.id,
        content: data.content,
        user: {
          id: data.user_id,
          name: (data.users as any)?.[0]?.fullName || (data.users as any)?.fullName || username,
        },
        createdAt: data.created_at,
      }

      // Broadcast to other clients in the same tenant/global channel
      await channel.send({
        type: 'broadcast',
        event: EVENT_MESSAGE_TYPE,
        payload: message,
      })

      // Update local state
      setMessages((current) => [...current, message])
    },
    [channel, isConnected, userId, username, supabase, tenantId]
  )

  return { messages, sendMessage, isConnected }
}
