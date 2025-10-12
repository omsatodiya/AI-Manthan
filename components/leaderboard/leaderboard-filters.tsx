'use client'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react'

export type SortBy = 'coins' | 'messages' | 'reactions'
export type SortOrder = 'desc' | 'asc'

interface LeaderboardFiltersProps {
  sortBy: SortBy
  sortOrder: SortOrder
  onSortByChange: (sortBy: SortBy) => void
  onSortOrderChange: (order: SortOrder) => void
}

export const LeaderboardFilters = ({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
}: LeaderboardFiltersProps) => {
  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-card rounded-lg border border-border">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Sort by:</span>
        <Select value={sortBy} onValueChange={(value) => onSortByChange(value as SortBy)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="coins">Coins (Default)</SelectItem>
            <SelectItem value="messages">Messages Sent</SelectItem>
            <SelectItem value="reactions">Reactions Received</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Order:</span>
        <div className="flex gap-1">
          <Button
            variant={sortOrder === 'desc' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSortOrderChange('desc')}
            className="gap-2"
          >
            <TrendingDown className="h-4 w-4" />
            Highest First
          </Button>
          <Button
            variant={sortOrder === 'asc' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSortOrderChange('asc')}
            className="gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Lowest First
          </Button>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowUpDown className="h-4 w-4" />
        <span>Showing ranked by {sortBy}</span>
      </div>
    </div>
  )
}
