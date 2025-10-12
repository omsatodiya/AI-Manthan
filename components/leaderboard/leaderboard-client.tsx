'use client'

import { LeaderboardList } from './leaderboard-list'
import type { UserProfile } from '@/lib/types/gamification'
import { Card } from '@/components/ui/card'
import { User } from 'lucide-react'

interface LeaderboardClientProps {
  profiles: UserProfile[]
  currentUserId: string
}

export const LeaderboardClient = ({ profiles, currentUserId }: LeaderboardClientProps) => {
  const currentUserProfile = profiles.find((p) => p.userId === currentUserId)

  return (
    <div className="space-y-6">
      {/* Current User Highlight */}
      {currentUserProfile && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-3 mb-2">
            <User className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold font-sans text-foreground">Your Rank</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">#{currentUserProfile.rank}</p>
              <p className="text-xs text-muted-foreground">Rank</p>
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
      <LeaderboardList profiles={profiles} />
    </div>
  )
}
