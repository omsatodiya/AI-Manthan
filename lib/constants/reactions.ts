import type { ReactionType } from '@/lib/types/chat'

export const REACTION_EMOJIS: Record<ReactionType, string> = {
  like: '👍',
  love: '❤️',
  haha: '😂',
  wow: '😮',
  sad: '😢',
  angry: '😠',
}

export const REACTION_LABELS: Record<ReactionType, string> = {
  like: 'Like',
  love: 'Love',
  haha: 'Haha',
  wow: 'Wow',
  sad: 'Sad',
  angry: 'Angry',
}

export const REACTION_TYPES: ReactionType[] = ['like', 'love', 'haha', 'wow', 'sad', 'angry']
