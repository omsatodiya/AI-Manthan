import { cn } from '@/lib/utils'
import type { ChatMessageWithUser } from '@/lib/types/chat'
import { MessageContextMenu } from './message-context-menu'
import { FileAttachment } from './file-attachment'

interface ChatMessageItemProps {
  message: ChatMessageWithUser
  currentUserId: string // Changed to use userId instead of username
  showHeader: boolean
  onDelete: (messageId: string) => void
  onEdit: (messageId: string, content: string) => void
}

export const ChatMessageItem = ({ message, currentUserId, showHeader, onDelete, onEdit }: ChatMessageItemProps) => {
  const isOwnMessage = message.user.id === currentUserId

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}>
      <MessageContextMenu
        messageId={message.id}
        messageContent={message.content}
        createdAt={message.createdAt}
        isOwnMessage={isOwnMessage}
        onDelete={onDelete}
        onEdit={onEdit}
      >
        <div
          className={cn('max-w-[70%] w-fit flex flex-col gap-2', {
            'items-end': isOwnMessage,
            'items-start': !isOwnMessage,
          })}
        >
          {showHeader && (
            <div
              className={cn('flex items-center gap-2 text-xs px-2', {
                'justify-end flex-row-reverse': isOwnMessage,
              })}
            >
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">{message.user.name.charAt(0).toUpperCase()}</span>
              </div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{message.user.name}</span>
              <span className="text-slate-500 dark:text-slate-400">
                {new Date(message.createdAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })}
              </span>
            </div>
          )}
          <div
            className={cn(
              'relative py-3 px-4 text-sm w-fit shadow-sm transition-all duration-200 group-hover:shadow-md',
              isOwnMessage 
                ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md' 
                : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl rounded-bl-md border border-slate-200 dark:border-slate-700'
            )}
          >
            {/* Message bubble tail */}
            <div className={cn(
              'absolute w-3 h-3 transform rotate-45',
              isOwnMessage 
                ? 'bg-primary bottom-0 right-0 translate-x-1 translate-y-1' 
                : 'bg-white dark:bg-slate-800 border-r border-b border-slate-200 dark:border-slate-700 bottom-0 left-0 -translate-x-1 translate-y-1'
            )}></div>
            
            {message.attachment ? (
              <div className="space-y-3">
                <FileAttachment attachment={message.attachment} isOwnMessage={isOwnMessage} />
                {message.content && message.content !== `Sent ${message.attachment.fileName}` && (
                  <div className="leading-relaxed">{message.content}</div>
                )}
              </div>
            ) : (
              <div className="leading-relaxed">{message.content}</div>
            )}
            {message.isEdited && (
              <div className={cn(
                "text-xs mt-1",
                isOwnMessage ? "text-blue-100" : "text-slate-500 dark:text-slate-400"
              )}>
                (edited)
              </div>
            )}
          </div>
        </div>
      </MessageContextMenu>
    </div>
  )
}
