'use client'

import { REACTION_EMOJIS } from '@/lib/constants/reactions'
import type { ReactionGroup, ReactionType } from '@/lib/types/chat'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface MessageReactionsProps {
  reactions: ReactionGroup[]
  onReactionClick: (reactionType: ReactionType) => void
  isOwnMessage?: boolean
}

export const MessageReactions = ({ reactions, onReactionClick, isOwnMessage }: MessageReactionsProps) => {
  if (reactions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      <TooltipProvider>
        {reactions.map((group) => (
          <Tooltip key={group.type}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onReactionClick(group.type)}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all',
                  'hover:scale-110 active:scale-95',
                  group.hasUserReacted
                    ? 'bg-primary/20 border border-primary/40 font-medium'
                    : 'bg-muted/50 border border-border hover:bg-muted'
                )}
              >
                <span>{REACTION_EMOJIS[group.type]}</span>
                <span className="text-xs">{group.count}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                {group.users.map((u) => u.name).join(', ')}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  )
}
