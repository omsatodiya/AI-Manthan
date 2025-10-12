'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge as BadgeIcon, Lock } from 'lucide-react'
import type { Badge, UserBadge } from '@/lib/types/gamification'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface UserBadgesCardProps {
  userBadges: UserBadge[]
  allBadges: Badge[]
}

const tierColors = {
  bronze: 'from-amber-700 to-amber-500',
  silver: 'from-gray-400 to-gray-300',
  gold: 'from-yellow-500 to-yellow-300',
  platinum: 'from-cyan-400 to-blue-500',
  diamond: 'from-purple-500 to-pink-500',
}

export const UserBadgesCard = ({ userBadges, allBadges }: UserBadgesCardProps) => {
  const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId))

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold font-sans flex items-center gap-2">
          <BadgeIcon className="h-5 w-5 text-primary" />
          Badges ({userBadges.length}/{allBadges.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {allBadges.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BadgeIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No badges available yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            <TooltipProvider>
              {allBadges.map((badge) => {
                const isEarned = earnedBadgeIds.has(badge.id)
                const userBadge = userBadges.find((ub) => ub.badgeId === badge.id)

                return (
                  <Tooltip key={badge.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all cursor-pointer',
                          isEarned
                            ? 'bg-gradient-to-br border-primary/50 hover:scale-105 shadow-md'
                            : 'bg-muted/30 border-border opacity-50 hover:opacity-70',
                          badge.tier && isEarned && tierColors[badge.tier]
                        )}
                      >
                        {!isEarned && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                            <Lock className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="text-3xl">{badge.icon}</div>
                        <p className="text-xs font-semibold font-sans text-center line-clamp-2">
                          {badge.name}
                        </p>
                        {badge.tier && isEarned && (
                          <span className="absolute top-1 right-1 text-xs px-1.5 py-0.5 rounded-full bg-background/80 text-foreground font-medium capitalize">
                            {badge.tier}
                          </span>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <div className="space-y-1">
                        <p className="font-semibold">{badge.name}</p>
                        {badge.description && (
                          <p className="text-xs text-muted-foreground">
                            {badge.description}
                          </p>
                        )}
                        <p className="text-xs">
                          Requirement: {badge.requirementValue}{' '}
                          {badge.requirementType.replace(/_/g, ' ')}
                        </p>
                        {isEarned && userBadge && (
                          <p className="text-xs text-green-500">
                            ✓ Earned on{' '}
                            {new Date(userBadge.earnedAt).toLocaleDateString()}
                          </p>
                        )}
                        {!isEarned && (
                          <p className="text-xs text-amber-500">
                            🔒 Not earned yet
                          </p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </TooltipProvider>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
