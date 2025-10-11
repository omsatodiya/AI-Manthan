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
    <div className={`flex mt-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <MessageContextMenu
        messageId={message.id}
        messageContent={message.content}
        createdAt={message.createdAt}
        isOwnMessage={isOwnMessage}
        onDelete={onDelete}
        onEdit={onEdit}
      >
        <div
          className={cn('max-w-[75%] w-fit flex flex-col gap-1', {
            'items-end': isOwnMessage,
          })}
        >
          {showHeader && (
            <div
              className={cn('flex items-center gap-2 text-xs px-3', {
                'justify-end flex-row-reverse': isOwnMessage,
              })}
            >
              <span className={'font-medium'}>{message.user.name}</span>
              <span className="text-foreground/50 text-xs">
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
              'py-2 px-3 rounded-xl text-sm w-fit',
              isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
            )}
          >
            {message.attachment ? (
              <div className="space-y-2">
                <FileAttachment attachment={message.attachment} isOwnMessage={isOwnMessage} />
                {message.content && message.content !== `Sent ${message.attachment.fileName}` && (
                  <div>{message.content}</div>
                )}
              </div>
            ) : (
              <div>{message.content}</div>
            )}
            {message.isEdited && (
              <span className="text-xs opacity-70 italic ml-2">(edited)</span>
            )}
          </div>
        </div>
      </MessageContextMenu>
    </div>
  )
}
