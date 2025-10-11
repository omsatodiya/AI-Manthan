import React from 'react'
import { redirect } from 'next/navigation'
import { RealtimeChat } from '@/components/community/realtime-chat'
import { getCurrentUserAction } from '@/app/actions/auth'
import { Users, MessageCircle, Settings, Crown } from 'lucide-react'

const CommunityPage = async () => {
  // Fetch current user from auth action
  const currentUser = await getCurrentUserAction()

  // Redirect to login if not authenticated
  if (!currentUser) {
    redirect('/login') // Adjust the login path as needed
  }

  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg shadow-md">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Community</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">Connect with your team</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Online</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20">
              <Crown className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{currentUser.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <div className="w-80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-r border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="p-6">
            <div className="space-y-6">
              {/* Active Members */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Active Members
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{currentUser.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{currentUser.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">You</p>
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-3 p-3 text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <Settings className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Settings</span>
                  </button>
                </div>
              </div>

              {/* Chat Info */}
              <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Chat Info</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Welcome to the community chat! Share ideas, ask questions, and collaborate with your team members.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <RealtimeChat
            userId={currentUser.id}
            username={currentUser.name}
            tenantId={currentUser.tenantId ?? undefined} // pass tenant scope
          />
        </div>
      </div>
    </div>
  )
}

export default CommunityPage
