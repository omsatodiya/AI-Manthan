'use client'

import { useEffect, useState } from 'react'
import { UserStatsCard } from './user-stats-card'
import { UserBadgesCard } from './user-badges-card'
import { gamificationService } from '@/lib/services/gamification-service'
import type { UserStats, Badge, UserBadge } from '@/lib/types/gamification'
import { Loader2 } from 'lucide-react'

interface CoinsBadgesSectionProps {
  userId: string
  userName: string
  tenantId?: string | null
}

export const CoinsBadgesSection = ({ userId, userName, tenantId }: CoinsBadgesSectionProps) => {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [userBadges, setUserBadges] = useState<UserBadge[]>([])
  const [allBadges, setAllBadges] = useState<Badge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const [fetchedStats, fetchedUserBadges, fetchedAllBadges] = await Promise.all([
          gamificationService.getUserStats(userId, tenantId),
          gamificationService.getUserBadges(userId, tenantId),
          gamificationService.getAllBadges(),
        ])

        setStats(fetchedStats)
        setUserBadges(fetchedUserBadges)
        setAllBadges(fetchedAllBadges)
      } catch (err) {
        console.error('Error fetching gamification data:', err)
        setError('Failed to load stats and badges')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [userId, userName, tenantId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <p>{error}</p>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="space-y-6">
      <UserStatsCard stats={stats} />
      <UserBadgesCard userBadges={userBadges} allBadges={allBadges} />
    </div>
  )
}
