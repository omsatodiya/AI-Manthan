import { redirect } from 'next/navigation'
import { getCurrentUserAction } from '@/app/actions/auth'
import { getLeaderboardAction } from '@/app/actions/profile'
import { LeaderboardClient } from '@/components/leaderboard/leaderboard-client'
import { Trophy, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const LeaderboardPage = async ({ params }: { params: Promise<{ tenant: string }> }) => {
  const { tenant } = await params
  const currentUser = await getCurrentUserAction()

  if (!currentUser) {
    redirect('/login')
  }

  // Fetch leaderboard data server-side scoped to the current tenant
  const leaderboard = await getLeaderboardAction(tenant, 50)

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 pt-20">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Premium Header */}
          <div className="relative py-10 px-6 overflow-hidden rounded-2xl bg-card border border-border shadow-sm">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />

            <div className="relative flex flex-col items-center text-center">
              <Link
                href="/community"
                className="absolute left-0 top-0 p-2 hover:bg-muted rounded-full transition-all group"
                title="Back to Community"
              >
                <ArrowLeft className="h-5 w-5 text-muted-foreground group-hover:-translate-x-1 transition-transform" />
              </Link>

              <div className="mb-6 p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-xl shadow-orange-500/20 rotate-3 hover:rotate-0 transition-transform duration-300">
                <Trophy className="h-10 w-10 text-white" />
              </div>
              
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-3 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                Community <span className="text-primary">Legends</span>
              </h1>
              
              <p className="max-w-md text-muted-foreground text-lg font-medium leading-relaxed">
                Celebrating the most active and engaged contributors in the community.
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
