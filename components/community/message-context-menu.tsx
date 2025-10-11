'use client'

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu'
import { Trash2, Clock, Pencil } from 'lucide-react'
import type { ReactNode } from 'react'
import { canEditMessage } from '@/lib/utils/chat-utils'

interface MessageContextMenuProps {
  children: ReactNode
  messageId: string
  messageContent: string
  createdAt: string
  isOwnMessage: boolean
  onDelete: (messageId: string) => void
  onEdit: (messageId: string, content: string) => void
}

export const MessageContextMenu = ({
  children,
  messageId,
  messageContent,
  createdAt,
  isOwnMessage,
  onDelete,
  onEdit,
}: MessageContextMenuProps) => {
  const formattedDate = new Date(createdAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  const canEdit = isOwnMessage && canEditMessage(createdAt)

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem disabled className="flex items-center gap-2 text-xs font-sans text-muted-foreground">
          <Clock className="size-3" />
          <span>{formattedDate}</span>
        </ContextMenuItem>
        {isOwnMessage && (
          <>
            <ContextMenuSeparator />
            {canEdit && (
              <ContextMenuItem
                className="flex items-center gap-2 font-sans"
                onClick={() => onEdit(messageId, messageContent)}
              >
                <Pencil className="size-4" />
                <span>Edit Message</span>
              </ContextMenuItem>
            )}
            <ContextMenuItem
              className="flex items-center gap-2 font-sans text-destructive focus:text-destructive"
              onClick={() => onDelete(messageId)}
            >
              <Trash2 className="size-4" />
              <span>Delete Message</span>
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}
