'use client'

import { cn } from '@/lib/utils'
import { ChatMessageItem } from '@/components/community/chat-message'
import { EditMessageDialog } from '@/components/community/edit-message-dialog'
import { FileUploadButton } from '@/components/community/file-upload-button'
import { useChatScroll } from '@/hooks/use-chat-scroll'
import { useRealtimeChat } from '@/hooks/use-realtime-chat'
import type { ChatMessageWithUser } from '@/lib/types/chat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, MessageCircle } from 'lucide-react'
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
    sendMessageWithFile,
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

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!isConnected) return
      await sendMessageWithFile(file, '')
    },
    [isConnected, sendMessageWithFile]
  )

  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground antialiased">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-border bg-card/40 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <h2 className="text-lg font-semibold font-sans text-foreground">General Chat</h2>
          </div>
          <div className="text-sm font-sans text-muted-foreground">
            {allMessages.length} message{allMessages.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/30">
        {allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold font-sans text-foreground mb-2">Welcome to the Community!</h3>
            <p className="text-sm font-sans text-muted-foreground max-w-sm">
              Start the conversation by sending your first message. Your team members will see it here.
            </p>
          </div>
        ) : null}
        <div className="space-y-4">
          {allMessages.map((message, index) => {
            const prevMessage = index > 0 ? allMessages[index - 1] : null
            const showHeader = !prevMessage || prevMessage.user.name !== message.user.name

            return (
              <div
                key={message.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
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

      {/* Message Input */}
      <div className="p-6 bg-card/60 backdrop-blur-sm border-t border-border">
        <form onSubmit={handleSendMessage} className="flex w-full gap-3">
          <div className="flex-1 relative">
            <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-sm"></div>
            <div className="relative bg-card rounded-2xl border border-border shadow-sm">
              <div className="flex items-center gap-3 p-3">
                <FileUploadButton onFileSelect={handleFileUpload} disabled={!isConnected} />
                <Input
                  className={cn(
                    'flex-1 border-0 bg-transparent text-sm font-sans placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0',
                    !isConnected && 'opacity-50'
                  )}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={isConnected ? "Type a message..." : "Connecting..."}
                  disabled={!isConnected}
                />
                {isConnected && newMessage.trim() && (
                  <Button
                    className="aspect-square rounded-xl bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200 animate-in fade-in slide-in-from-right-4"
                    type="submit"
                    disabled={!isConnected}
                    size="sm"
                  >
                    <Send className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </form>
        
        {/* Connection Status */}
        <div className="flex items-center justify-center mt-3">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium font-sans transition-colors",
            isConnected 
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
          )}>
            <div className={cn(
              "w-2 h-2 rounded-full",
              isConnected ? "bg-green-500 animate-pulse" : "bg-yellow-500"
            )}></div>
            {isConnected ? "Connected" : "Connecting..."}
          </div>
        </div>
      </div>

      <EditMessageDialog
        open={!!editingMessage}
        onOpenChange={(open) => !open && setEditingMessage(null)}
        initialContent={editingMessage?.content || ''}
        onConfirm={handleConfirmEdit}
      />
    </div>
  )
}
