'use client'

import { cn } from '@/lib/utils'
import { ChatMessageItem } from '@/components/community/chat-message'
import { EditMessageDialog } from '@/components/community/edit-message-dialog'
import { useChatScroll } from '@/hooks/use-chat-scroll'
import { useRealtimeChat } from '@/hooks/use-realtime-chat'
import type { ChatMessageWithUser } from '@/lib/types/chat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface RealtimeChatProps {
  userId: string      // Added userId for FK association
  username: string
  tenantId?: string | null  // Add tenantId prop
  onMessage?: (messages: ChatMessageWithUser[]) => void
  messages?: ChatMessageWithUser[]
}

/**
 * Realtime chat component for tenant-scoped or global chatbox
 * @param userId - The ID of the logged-in user (from users table)
 * @param username - The username of the user for display
 * @param tenantId - The tenant ID to scope messages (null for global)
 * @param onMessage - The callback function to handle the messages
 * @param messages - The messages to display in the chat
 * @returns The chat component
 */
export const RealtimeChat = ({
  userId,
  username,
  tenantId,
  onMessage,
  messages: initialMessages = [],
}: RealtimeChatProps) => {
  const { containerRef, scrollToBottom } = useChatScroll()

  const {
    messages: realtimeMessages,
    sendMessage,
    deleteMessage,
    updateMessage,
    isConnected,
  } = useRealtimeChat({
    userId,
    username,
    tenantId,
  })
  const [newMessage, setNewMessage] = useState('')
  const [editingMessage, setEditingMessage] = useState<{ id: string; content: string } | null>(null)

  // Merge realtime messages with initial messages
  const allMessages = useMemo(() => {
    const mergedMessages = [...initialMessages, ...realtimeMessages]
    // Remove duplicates based on message id
    const uniqueMessages = mergedMessages.filter(
      (message, index, self) => index === self.findIndex((m) => m.id === message.id)
    )
    // Sort by creation date
    const sortedMessages = uniqueMessages.sort((a, b) => a.createdAt.localeCompare(b.createdAt))

    return sortedMessages
  }, [initialMessages, realtimeMessages])

  useEffect(() => {
    if (onMessage) {
      onMessage(allMessages)
    }
  }, [allMessages, onMessage])

  useEffect(() => {
    // Scroll to bottom whenever messages change
    scrollToBottom()
  }, [allMessages, scrollToBottom])

  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!newMessage.trim() || !isConnected) return

      sendMessage(newMessage)
      setNewMessage('')
    },
    [newMessage, isConnected, sendMessage]
  )

  const handleDeleteMessage = useCallback(
    (messageId: string) => {
      deleteMessage(messageId)
    },
    [deleteMessage]
  )

  const handleEditMessage = useCallback(
    (messageId: string, content: string) => {
      setEditingMessage({ id: messageId, content })
    },
    []
  )

  const handleConfirmEdit = useCallback(
    (newContent: string) => {
      if (editingMessage) {
        updateMessage(editingMessage.id, newContent)
      }
    },
    [editingMessage, updateMessage]
  )

  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground antialiased">
      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {allMessages.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : null}
        <div className="space-y-1">
          {allMessages.map((message, index) => {
            const prevMessage = index > 0 ? allMessages[index - 1] : null
            const showHeader = !prevMessage || prevMessage.user.name !== message.user.name

            return (
              <div
                key={message.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-300"
              >
                <ChatMessageItem
                  message={message}
                  currentUserId={userId}
                  showHeader={showHeader}
                  onDelete={handleDeleteMessage}
                  onEdit={handleEditMessage}
                />
              </div>
            )
          })}
        </div>
      </div>

      <form onSubmit={handleSendMessage} className="flex w-full gap-2 border-t border-border p-4">
        <Input
          className={cn(
            'rounded-full bg-background text-sm transition-all duration-300',
            isConnected && newMessage.trim() ? 'w-[calc(100%-36px)]' : 'w-full'
          )}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={!isConnected}
        />
        {isConnected && newMessage.trim() && (
          <Button
            className="aspect-square rounded-full animate-in fade-in slide-in-from-right-4 duration-300"
            type="submit"
            disabled={!isConnected}
          >
            <Send className="size-4" />
          </Button>
        )}
      </form>

      <EditMessageDialog
        open={!!editingMessage}
        onOpenChange={(open) => !open && setEditingMessage(null)}
        initialContent={editingMessage?.content || ''}
        onConfirm={handleConfirmEdit}
      />
    </div>
  )
}
