import React from "react";
import { redirect } from "next/navigation";
import { RealtimeChat } from "@/components/community/realtime-chat";
import { SangamChat } from "@/components/community/sangam-chat";
import { getCurrentUserAction } from "@/app/actions/auth";
import {
  Users,
  MessageCircle,
  Crown,
  ArrowLeft,
  Trophy,
} from "lucide-react";
import Link from "next/link";

const CommunityPage = async () => {
  const currentUser = await getCurrentUserAction();

  if (!currentUser) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 pt-16">
    <div className="h-screen w-full bg-background">
      {/* Header */}
      <div className="h-16 bg-card/80 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg shadow-md">
                <MessageCircle className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-sans text-foreground">
                  Community
                </h1>
                <p className="text-sm font-sans text-muted-foreground">
                  Connect with your team
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium font-sans text-foreground">
                Online
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20">
              <Crown className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium font-sans text-foreground">
                {currentUser.name}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <div className="w-80 bg-card/60 backdrop-blur-sm border-r border-border shadow-sm flex flex-col">
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="space-y-6">
              {/* Active Members */}
              <div>
                <h3 className="text-sm font-semibold font-sans text-foreground mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Active Members
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-primary-foreground">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium font-sans text-foreground">
                        {currentUser.name}
                      </p>
                      <p className="text-xs font-sans text-muted-foreground">
                        You
                      </p>
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Quick Links - Moved above AI Assistant */}
              <div>
                <h3 className="text-sm font-semibold font-sans text-foreground mb-3">
                  Quick Links
                </h3>
                <div className="space-y-2">
                  <Link
                    href="/leaderboard"
                    className="w-full flex items-center gap-3 p-3 text-left rounded-lg bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-all group"
                  >
                    <Trophy className="h-5 w-5 text-amber-500 group-hover:scale-110 transition-transform" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">Leaderboard</p>
                      <p className="text-xs text-muted-foreground">See top contributors</p>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Sangam AI Assistant */}
              <div>
                <h3 className="text-sm font-semibold font-sans text-foreground mb-3">
                  AI Assistant
                </h3>
                <div className="space-y-2">
                  <SangamChat tenantId={currentUser.tenantId ?? undefined} />
                </div>
              </div>

              {/* Chat Info */}
              <div className="p-4 bg-muted rounded-lg border border-border">
                <h4 className="text-sm font-semibold font-sans text-foreground mb-2">
                  Chat Info
                </h4>
                <p className="text-xs font-sans text-muted-foreground leading-relaxed">
                  Welcome to the community chat! Share ideas, ask questions, and
                  collaborate with your team members. Use Sangam AI to get
                  insights from your conversations.
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
            tenantId={currentUser.tenantId ?? undefined}
          />
        </div>
      </div>
    </div>
    </div>
  );
};

export default CommunityPage;
