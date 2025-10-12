import { redirect } from 'next/navigation'
import { getCurrentUserAction } from '@/app/actions/auth'
import { getLeaderboardAction } from '@/app/actions/profile'
import { LeaderboardClient } from '@/components/leaderboard/leaderboard-client'
import { Trophy, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const LeaderboardPage = async () => {
  const currentUser = await getCurrentUserAction()

  if (!currentUser) {
    redirect('/login')
  }

  // Fetch leaderboard data server-side
  const leaderboard = await getLeaderboardAction(currentUser.tenantId ?? null, 50)

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 pt-20">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-start gap-6">
            <Link
              href="/community"
              className="p-2 hover:bg-muted rounded-lg transition-colors mt-2"
            >
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </Link>
            
            <div className="flex-1 flex flex-col items-center text-center">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-primary rounded-lg shadow-lg">
                  <Trophy className="h-8 w-8 text-primary-foreground" />
                </div>
                <h1 className="text-3xl font-bold font-sans text-foreground">
                  Leaderboard
                </h1>
              </div>
              <p className="text-sm font-sans text-muted-foreground">
                Top community contributors
              </p>
            </div>
            
            {/* Spacer to balance the layout */}
            <div className="w-9"></div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-card rounded-lg border border-border">
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Users</p>
              <p className="text-2xl font-bold text-foreground">{leaderboard.length}</p>
            </div>
            <div className="p-4 bg-card rounded-lg border border-border">
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Coins</p>
              <p className="text-2xl font-bold text-foreground">
                {leaderboard.reduce((sum, p) => sum + p.stats.coins, 0)}
              </p>
            </div>
            <div className="p-4 bg-card rounded-lg border border-border">
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Messages</p>
              <p className="text-2xl font-bold text-foreground">
                {leaderboard.reduce((sum, p) => sum + p.stats.totalMessages, 0)}
              </p>
            </div>
          </div>

          {/* Leaderboard List */}
          <LeaderboardClient
            profiles={leaderboard}
            currentUserId={currentUser.id}
          />
        </div>
      </div>
    </div>
  )
}

export default LeaderboardPage
