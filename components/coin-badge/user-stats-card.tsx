'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Coins, MessageSquare, ThumbsUp, Heart } from 'lucide-react'
import type { UserStats } from '@/lib/types/gamification'

interface UserStatsCardProps {
  stats: UserStats
}

export const UserStatsCard = ({ stats }: UserStatsCardProps) => {
  const statItems = [
    {
      label: 'Coins',
      value: stats.coins,
      icon: Coins,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: 'Messages',
      value: stats.totalMessages,
      icon: MessageSquare,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Reactions Received',
      value: stats.totalReactionsReceived,
      icon: Heart,
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
    },
    {
      label: 'Reactions Given',
      value: stats.totalReactionsGiven,
      icon: ThumbsUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
  ]

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold font-sans flex items-center gap-2">
          <Coins className="h-5 w-5 text-amber-500" />
          Community Stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {statItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className={`p-2 rounded-lg ${item.bgColor}`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold font-sans text-foreground">
                  {item.value}
                </p>
                <p className="text-xs font-sans text-muted-foreground">
                  {item.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
