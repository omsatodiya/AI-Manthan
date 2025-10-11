'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient as createBrowserClient } from '@supabase/supabase-js'
import type { ChatMessageWithUser, DeleteMessagePayload, UpdateMessagePayload } from '@/lib/types/chat'
import { chatService } from '@/lib/services/chat-service'

interface UseRealtimeChatProps {
  userId: string
  username: string
  tenantId?: string | null
}

const EVENT_MESSAGE_TYPE = 'message'
const EVENT_DELETE_MESSAGE_TYPE = 'delete-message'
const EVENT_UPDATE_MESSAGE_TYPE = 'update-message'
const GLOBAL_CHANNEL_NAME = 'global-chat'

export function useRealtimeChat({ userId, username, tenantId }: UseRealtimeChatProps) {
  // Memoize the Supabase client to prevent recreation on every render
  const supabase = useMemo(() => 
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
    ),
    []
  )
  
  const [messages, setMessages] = useState<ChatMessageWithUser[]>([])
  const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    let isMounted = true

    // Fetch all persisted messages from the chatbox (filtered by tenant)
    const fetchMessages = async () => {
      try {
        const fetchedMessages = await chatService.fetchMessages(tenantId)
        if (isMounted) {
          setMessages(fetchedMessages)
        }
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
        setMessages((current) => [...current, payload.payload as ChatMessageWithUser])
      })
      .on('broadcast', { event: EVENT_DELETE_MESSAGE_TYPE }, (payload) => {
        const { messageId } = payload.payload as DeleteMessagePayload
        setMessages((current) => current.filter((msg) => msg.id !== messageId))
      })
      .on('broadcast', { event: EVENT_UPDATE_MESSAGE_TYPE }, (payload) => {
        const { messageId, content, updatedAt } = payload.payload as UpdateMessagePayload
        setMessages((current) =>
          current.map((msg) =>
            msg.id === messageId
              ? { ...msg, content, updatedAt, isEdited: true }
              : msg
          )
        )
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
  }, [supabase, tenantId])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!channel || !isConnected) return

      try {
        // Insert message into database using service
        const message = await chatService.createMessage(userId, content, username, tenantId)

        // Broadcast to other clients in the same tenant/global channel
        await channel.send({
          type: 'broadcast',
          event: EVENT_MESSAGE_TYPE,
          payload: message,
        })

        // Update local state
        setMessages((current) => [...current, message])
      } catch (error) {
        console.error('Failed to send message:', error)
      }
    },
    [channel, isConnected, userId, username, tenantId]
  )

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!channel || !isConnected) return

      try {
        // Delete message from database (and attachment from storage)
        const attachmentId = await chatService.deleteMessage(messageId, userId)

        const deletePayload: DeleteMessagePayload = {
          messageId,
          userId,
          attachmentId,
        }

        // Broadcast deletion to other clients
        await channel.send({
          type: 'broadcast',
          event: EVENT_DELETE_MESSAGE_TYPE,
          payload: deletePayload,
        })

        // Update local state
        setMessages((current) => current.filter((msg) => msg.id !== messageId))
      } catch (error) {
        console.error('Failed to delete message:', error)
        throw error
      }
    },
    [channel, isConnected, userId]
  )

  const updateMessage = useCallback(
    async (messageId: string, content: string) => {
      if (!channel || !isConnected) return

      try {
        // Update message in database using service
        const updatedMessage = await chatService.updateMessage(messageId, userId, content)

        const updatePayload: UpdateMessagePayload = {
          messageId,
          content,
          userId,
          updatedAt: updatedMessage.updatedAt || new Date().toISOString(),
        }

        // Broadcast update to other clients
        await channel.send({
          type: 'broadcast',
          event: EVENT_UPDATE_MESSAGE_TYPE,
          payload: updatePayload,
        })

        // Update local state
        setMessages((current) =>
          current.map((msg) =>
            msg.id === messageId
              ? { ...msg, content, updatedAt: updatePayload.updatedAt, isEdited: true }
              : msg
          )
        )
      } catch (error) {
        console.error('Failed to update message:', error)
      }
    },
    [channel, isConnected, userId]
  )

  const sendMessageWithFile = useCallback(
    async (file: File, content: string = '') => {
      if (!channel || !isConnected) return

      try {
        // Upload file first
        const attachment = await chatService.uploadFile({ file, userId, tenantId })

        // Create message with attachment
        const message = await chatService.createMessageWithAttachment(
          userId,
          content,
          username,
          attachment,
          tenantId
        )

        // Broadcast to other clients
        await channel.send({
          type: 'broadcast',
          event: EVENT_MESSAGE_TYPE,
          payload: message,
        })

        // Update local state
        setMessages((current) => [...current, message])
      } catch (error) {
        console.error('Failed to send message with file:', error)
        throw error
      }
    },
    [channel, isConnected, userId, username, tenantId]
  )

  return { messages, sendMessage, sendMessageWithFile, deleteMessage, updateMessage, isConnected }
}
