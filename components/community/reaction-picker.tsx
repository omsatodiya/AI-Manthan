'use client'

import { REACTION_EMOJIS, REACTION_TYPES, REACTION_LABELS } from '@/lib/constants/reactions'
import type { ReactionType } from '@/lib/types/chat'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Smile } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ReactionPickerProps {
  onReactionSelect: (reactionType: ReactionType) => void
  disabled?: boolean
}

export const ReactionPicker = ({ onReactionSelect, disabled }: ReactionPickerProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-muted-foreground hover:text-foreground"
          disabled={disabled}
        >
          <Smile className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="flex gap-1">
          {REACTION_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => onReactionSelect(type)}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-2xl"
              title={REACTION_LABELS[type]}
            >
              {REACTION_EMOJIS[type]}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
