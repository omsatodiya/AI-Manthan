import { LeaderboardUserCard } from './leaderboard-user-card'
import type { UserProfile } from '@/lib/types/gamification'
import { Loader2 } from 'lucide-react'

interface LeaderboardListProps {
  profiles: UserProfile[]
  isLoading?: boolean
}

export const LeaderboardList = ({ profiles, isLoading }: LeaderboardListProps) => {
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
    <div className="space-y-3">
      {profiles.map((profile, index) => (
        <div
          key={profile.userId}
          className="animate-in fade-in slide-in-from-bottom-4"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <LeaderboardUserCard profile={profile} index={index} />
        </div>
      ))}
    </div>
  )
}
