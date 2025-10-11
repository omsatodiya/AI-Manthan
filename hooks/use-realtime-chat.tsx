'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient as createBrowserClient } from '@supabase/supabase-js'
import type { ChatMessageWithUser, DeleteMessagePayload, UpdateMessagePayload, AddReactionPayload, RemoveReactionPayload, ReactionType } from '@/lib/types/chat'
import { chatService } from '@/lib/services/chat-service'

interface UseRealtimeChatProps {
  userId: string
  username: string
  tenantId?: string | null
}

const EVENT_MESSAGE_TYPE = 'message'
const EVENT_DELETE_MESSAGE_TYPE = 'delete-message'
const EVENT_UPDATE_MESSAGE_TYPE = 'update-message'
const EVENT_ADD_REACTION_TYPE = 'add-reaction'
const EVENT_REMOVE_REACTION_TYPE = 'remove-reaction'
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
        
        // Fetch reactions for all messages
        const messageIds = fetchedMessages.map((m) => m.id)
        const reactionsMap = await chatService.fetchReactions(messageIds, userId)
        
        // Attach reactions to messages
        const messagesWithReactions = fetchedMessages.map((msg) => ({
          ...msg,
          reactions: reactionsMap.get(msg.id) || [],
        }))
        
        if (isMounted) {
          setMessages(messagesWithReactions)
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
      .on('broadcast', { event: EVENT_ADD_REACTION_TYPE }, (payload) => {
        const { messageId, userId: reactorId, userName, reactionType, replacedReactionType } = payload.payload as AddReactionPayload
        
        setMessages((current) =>
          current.map((msg) => {
            if (msg.id !== messageId) return msg
            
            let reactions = msg.reactions || []
            
            // If there was a replaced reaction, remove it first
            if (replacedReactionType) {
              reactions = reactions
                .map((r) => {
                  if (r.type !== replacedReactionType) return r
                  
                  // Remove this user from the replaced reaction
                  const newUsers = r.users.filter((u) => u.id !== reactorId)
                  return {
                    ...r,
                    count: r.count - 1,
                    users: newUsers,
                    hasUserReacted: r.hasUserReacted && reactorId !== userId,
                  }
                })
                .filter((r) => r.count > 0) // Remove groups with no reactions
            }
            
            // Now add the new reaction
            const existingGroup = reactions.find((r) => r.type === reactionType)
            
            if (existingGroup) {
              // Check if user already in this group (shouldn't happen, but safety check)
              const userAlreadyReacted = existingGroup.users.some((u) => u.id === reactorId)
              
              if (userAlreadyReacted) {
                return { ...msg, reactions }
              }
              
              return {
                ...msg,
                reactions: reactions.map((r) =>
                  r.type === reactionType
                    ? {
                        ...r,
                        count: r.count + 1,
                        users: [...r.users, { id: reactorId, name: userName }],
                        hasUserReacted: r.hasUserReacted || reactorId === userId,
                      }
                    : r
                ),
              }
            } else {
              return {
                ...msg,
                reactions: [
                  ...reactions,
                  {
                    type: reactionType,
                    count: 1,
                    users: [{ id: reactorId, name: userName }],
                    hasUserReacted: reactorId === userId,
                  },
                ],
              }
            }
          })
        )
      })
      .on('broadcast', { event: EVENT_REMOVE_REACTION_TYPE }, (payload) => {
        const { messageId, userId: reactorId, reactionType } = payload.payload as RemoveReactionPayload
        
        setMessages((current) =>
          current.map((msg) => {
            if (msg.id !== messageId) return msg
            
            const reactions = msg.reactions || []
            return {
              ...msg,
              reactions: reactions
                .map((r) => {
                  if (r.type !== reactionType) return r
                  
                  const newUsers = r.users.filter((u) => u.id !== reactorId)
                  return {
                    ...r,
                    count: r.count - 1,
                    users: newUsers,
                    hasUserReacted: r.hasUserReacted && reactorId !== userId,
                  }
                })
                .filter((r) => r.count > 0),
            }
          })
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
  }, [supabase, tenantId, userId])

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

  const addReaction = useCallback(
    async (messageId: string, reactionType: ReactionType) => {
      if (!channel || !isConnected) return

      try {
        const { reaction, replacedReactionType } = await chatService.addReaction(
          messageId, 
          userId, 
          username, 
          reactionType, 
          tenantId
        )

        const payload: AddReactionPayload = {
          messageId,
          userId,
          userName: username,
          reactionType,
          tenantId,
          replacedReactionType,
        }

        // Broadcast the reaction change
        await channel.send({
          type: 'broadcast',
          event: EVENT_ADD_REACTION_TYPE,
          payload,
        })

        // Update local state immediately
        setMessages((current) =>
          current.map((msg) => {
            if (msg.id !== messageId) return msg
            
            let reactions = msg.reactions || []
            
            // Remove replaced reaction if exists
            if (replacedReactionType) {
              reactions = reactions
                .map((r) => {
                  if (r.type !== replacedReactionType) return r
                  
                  const newUsers = r.users.filter((u) => u.id !== userId)
                  return {
                    ...r,
                    count: r.count - 1,
                    users: newUsers,
                    hasUserReacted: false,
                  }
                })
                .filter((r) => r.count > 0)
            }
            
            // Add new reaction
            const existingGroup = reactions.find((r) => r.type === reactionType)
            
            if (existingGroup) {
              return {
                ...msg,
                reactions: reactions.map((r) =>
                  r.type === reactionType
                    ? {
                        ...r,
                        count: r.count + 1,
                        users: [...r.users, { id: userId, name: username }],
                        hasUserReacted: true,
                      }
                    : r
                ),
              }
            } else {
              return {
                ...msg,
                reactions: [
                  ...reactions,
                  {
                    type: reactionType,
                    count: 1,
                    users: [{ id: userId, name: username }],
                    hasUserReacted: true,
                  },
                ],
              }
            }
          })
        )
      } catch (error) {
        console.error('Failed to add reaction:', error)
        throw error
      }
    },
    [channel, isConnected, userId, username, tenantId]
  )

  const removeReaction = useCallback(
    async (messageId: string, reactionType: ReactionType) => {
      if (!channel || !isConnected) return

      try {
        await chatService.removeReaction(messageId, userId, reactionType)

        const payload: RemoveReactionPayload = {
          messageId,
          userId,
          reactionType,
        }

        await channel.send({
          type: 'broadcast',
          event: EVENT_REMOVE_REACTION_TYPE,
          payload,
        })

        // Update local state immediately
        setMessages((current) =>
          current.map((msg) => {
            if (msg.id !== messageId) return msg
            
            const reactions = msg.reactions || []
            return {
              ...msg,
              reactions: reactions
                .map((r) => {
                  if (r.type !== reactionType) return r
                  
                  const newUsers = r.users.filter((u) => u.id !== userId)
                  return {
                    ...r,
                    count: r.count - 1,
                    users: newUsers,
                    hasUserReacted: false,
                  }
                })
                .filter((r) => r.count > 0),
            }
          })
        )
      } catch (error) {
        console.error('Failed to remove reaction:', error)
        throw error
      }
    },
    [channel, isConnected, userId]
  )

  return { 
    messages, 
    sendMessage, 
    sendMessageWithFile, 
    deleteMessage, 
    updateMessage, 
    addReaction, 
    removeReaction, 
    isConnected 
  }
}
