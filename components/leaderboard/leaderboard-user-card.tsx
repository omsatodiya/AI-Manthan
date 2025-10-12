'use client'

import { Card } from '@/components/ui/card'
import { Coins, Crown, Medal, Award } from 'lucide-react'
import type { UserProfile } from '@/lib/types/gamification'
import { cn } from '@/lib/utils'

interface LeaderboardUserCardProps {
  profile: UserProfile
  index: number
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="h-6 w-6 text-yellow-500" />
    case 2:
      return <Medal className="h-6 w-6 text-gray-400" />
    case 3:
      return <Award className="h-6 w-6 text-amber-600" />
    default:
      return null
  }
}

const getRankColor = (rank: number) => {
  switch (rank) {
    case 1:
      return 'from-yellow-500/20 to-amber-500/20 border-yellow-500/50'
    case 2:
      return 'from-gray-400/20 to-gray-500/20 border-gray-400/50'
    case 3:
      return 'from-amber-600/20 to-orange-500/20 border-amber-600/50'
    default:
      return 'from-muted/50 to-muted/30 border-border'
  }
}

export const LeaderboardUserCard = ({ profile, index }: LeaderboardUserCardProps) => {
  const rank = profile.rank || index + 1
  const isTopThree = rank <= 3

  return (
    <Card
      className={cn(
        'p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg',
        isTopThree && 'bg-gradient-to-r border-2',
        getRankColor(rank)
      )}
    >
      <div className="flex items-center gap-4">
        {/* Rank */}
        <div className="flex-shrink-0">
          {isTopThree ? (
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center shadow-md">
                {getRankIcon(rank)}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                {rank}
              </div>
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <span className="text-lg font-bold text-muted-foreground">#{rank}</span>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold font-sans text-foreground truncate">
              {profile.userName}
            </h3>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Coins className="h-4 w-4 text-amber-500" />
              <span className="font-medium text-foreground">{profile.stats.coins}</span>
              <span className="text-muted-foreground">coins</span>
            </div>
            <div className="h-4 w-px bg-border"></div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-foreground">{profile.stats.totalMessages}</span>
              <span className="text-muted-foreground">messages</span>
            </div>
            <div className="h-4 w-px bg-border"></div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-foreground">{profile.stats.totalReactionsReceived}</span>
              <span className="text-muted-foreground">reactions</span>
            </div>
          </div>
        </div>

        {/* Badges Preview */}
        <div className="flex-shrink-0">
          <div className="flex items-center gap-1">
            {profile.badges.slice(0, 3).map((userBadge) => (
              <div
                key={userBadge.id}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-lg"
                title={userBadge.badge?.name}
              >
                {userBadge.badge?.icon}
              </div>
            ))}
            {profile.badges.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                +{profile.badges.length - 3}
              </div>
            )}
            {profile.badges.length === 0 && (
              <span className="text-xs text-muted-foreground">No badges</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
