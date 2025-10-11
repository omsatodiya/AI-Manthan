'use client'

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { Trash2, Clock } from 'lucide-react'
import type { ReactNode } from 'react'

interface MessageContextMenuProps {
  children: ReactNode
  messageId: string
  createdAt: string
  isOwnMessage: boolean
  onDelete: (messageId: string) => void
}

export const MessageContextMenu = ({
  children,
  messageId,
  createdAt,
  isOwnMessage,
  onDelete,
}: MessageContextMenuProps) => {
  const formattedDate = new Date(createdAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem disabled className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="size-3" />
          <span>{formattedDate}</span>
        </ContextMenuItem>
        {isOwnMessage && (
          <ContextMenuItem
            className="flex items-center gap-2 text-destructive focus:text-destructive"
            onClick={() => onDelete(messageId)}
          >
            <Trash2 className="size-4" />
            <span>Delete Message</span>
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}
