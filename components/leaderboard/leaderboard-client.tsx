'use client'

import { useState, useMemo } from 'react'
import { LeaderboardList } from './leaderboard-list'
import { LeaderboardFilters, type SortBy, type SortOrder } from './leaderboard-filters'
import type { UserProfile } from '@/lib/types/gamification'
import { Card } from '@/components/ui/card'
import { User } from 'lucide-react'

interface LeaderboardClientProps {
  profiles: UserProfile[]
  currentUserId: string
}

export const LeaderboardClient = ({ profiles, currentUserId }: LeaderboardClientProps) => {
  const [sortBy, setSortBy] = useState<SortBy>('reactions')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const sortedProfiles = useMemo(() => {
    const sorted = [...profiles].sort((a, b) => {
      let valA = 0
      let valB = 0

      if (sortBy === 'reactions') {
        valA = a.stats.totalReactionsReceived
        valB = b.stats.totalReactionsReceived
      } else if (sortBy === 'messages') {
        valA = a.stats.totalMessages
        valB = b.stats.totalMessages
      } else {
        valA = a.stats.coins
        valB = b.stats.coins
      }

      const diff = sortOrder === 'desc' ? valB - valA : valA - valB
      
      // Tie-breaker
      if (diff === 0) {
        return b.stats.coins - a.stats.coins
      }
      
      return diff
    })

    // Re-assign ranks based on current sort
    return sorted.map((profile, index) => ({
      ...profile,
      rank: index + 1,
    }))
  }, [profiles, sortBy, sortOrder])

  const currentUserProfile = sortedProfiles.find((p) => p.userId === currentUserId)

  return (
    <div className="space-y-6">
      {/* Filters */}
      <LeaderboardFilters
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortByChange={setSortBy}
        onSortOrderChange={setSortOrder}
      />

      {/* Current User Highlight */}
      {currentUserProfile && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-3 mb-2">
            <User className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold font-sans text-foreground">Your Rank</h3>
          </div>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">#{currentUserProfile.rank}</p>
              <p className="text-xs text-muted-foreground">Rank</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{currentUserProfile.stats.totalReactionsReceived}</p>
              <p className="text-xs text-muted-foreground">Reactions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{currentUserProfile.stats.coins}</p>
              <p className="text-xs text-muted-foreground">Coins</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{currentUserProfile.badges.length}</p>
              <p className="text-xs text-muted-foreground">Badges</p>
            </div>
          </div>
        </Card>
      )}

      {/* Leaderboard */}
      <LeaderboardList profiles={sortedProfiles} />
    </div>
  )
}
