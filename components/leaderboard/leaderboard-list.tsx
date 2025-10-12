'use client'

import { useState, useMemo } from 'react'
import { LeaderboardUserCard } from './leaderboard-user-card'
import { LeaderboardFilters, type SortBy, type SortOrder } from './leaderboard-filters'
import type { UserProfile } from '@/lib/types/gamification'
import { Loader2 } from 'lucide-react'

interface LeaderboardListProps {
  profiles: UserProfile[]
  isLoading?: boolean
}

export const LeaderboardList = ({ profiles, isLoading }: LeaderboardListProps) => {
  const [sortBy, setSortBy] = useState<SortBy>('coins')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Sort and rank profiles
  const sortedProfiles = useMemo(() => {
    const sorted = [...profiles].sort((a, b) => {
      let valueA: number
      let valueB: number

      switch (sortBy) {
        case 'coins':
          valueA = a.stats.coins
          valueB = b.stats.coins
          break
        case 'messages':
          valueA = a.stats.totalMessages
          valueB = b.stats.totalMessages
          break
        case 'reactions':
          valueA = a.stats.totalReactionsReceived
          valueB = b.stats.totalReactionsReceived
          break
        default:
          valueA = a.stats.coins
          valueB = b.stats.coins
      }

      return sortOrder === 'desc' ? valueB - valueA : valueA - valueB
    })

    // Re-assign ranks based on current sort
    return sorted.map((profile, index) => ({
      ...profile,
      rank: index + 1,
    }))
  }, [profiles, sortBy, sortOrder])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (profiles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No users found in the leaderboard yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <LeaderboardFilters
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortByChange={setSortBy}
        onSortOrderChange={setSortOrder}
      />

      <div className="space-y-3">
        {sortedProfiles.map((profile, index) => (
          <div
            key={profile.userId}
            className="animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <LeaderboardUserCard profile={profile} index={index} />
          </div>
        ))}
      </div>
    </div>
  )
}
