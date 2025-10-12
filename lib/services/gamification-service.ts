import { createClient as createBrowserClient } from '@supabase/supabase-js'
import type { UserStats, Badge, UserBadge, UserProfile } from '@/lib/types/gamification'

export class GamificationService {
  private supabase: ReturnType<typeof createBrowserClient>

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration for Gamification Service')
    }
    
    this.supabase = createBrowserClient(supabaseUrl, supabaseKey)
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string, tenantId?: string | null): Promise<UserStats | null> {
    try {
      let query = this.supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)

      if (tenantId) {
        query = query.eq('tenant_id', tenantId)
      } else {
        query = query.is('tenant_id', null)
      }

      const { data, error } = await query.single()

      if (error) {
        // If no stats found, return default
        if (error.code === 'PGRST116') {
          return {
            id: '',
            userId,
            tenantId: tenantId || null,
            totalReactionsReceived: 0,
            totalReactionsGiven: 0,
            totalMessages: 0,
            coins: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        }
        throw error
      }

      return {
        id: data.id,
        userId: data.user_id,
        tenantId: data.tenant_id,
        totalReactionsReceived: data.total_reactions_received,
        totalReactionsGiven: data.total_reactions_given,
        totalMessages: data.total_messages,
        coins: data.coins,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
      throw error
    }
  }

  /**
   * Get all available badges
   */
  async getAllBadges(): Promise<Badge[]> {
    try {
      const { data, error } = await this.supabase
        .from('badges')
        .select('*')
        .order('requirement_value', { ascending: true })

      if (error) throw error

      return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        icon: row.icon,
        requirementType: row.requirement_type,
        requirementValue: row.requirement_value,
        tier: row.tier,
        createdAt: row.created_at,
      }))
    } catch (error) {
      console.error('Error fetching badges:', error)
      throw error
    }
  }

  /**
   * Get user's earned badges
   */
  async getUserBadges(userId: string, tenantId?: string | null): Promise<UserBadge[]> {
    try {
      let query = this.supabase
        .from('user_badges')
        .select(`
          *,
          badges (*)
        `)
        .eq('user_id', userId)

      if (tenantId) {
        query = query.eq('tenant_id', tenantId)
      } else {
        query = query.is('tenant_id', null)
      }

      const { data, error } = await query.order('earned_at', { ascending: false })

      if (error) throw error

      return data.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        badgeId: row.badge_id,
        tenantId: row.tenant_id,
        earnedAt: row.earned_at,
        badge: row.badges ? {
          id: row.badges.id,
          name: row.badges.name,
          description: row.badges.description,
          icon: row.badges.icon,
          requirementType: row.badges.requirement_type,
          requirementValue: row.badges.requirement_value,
          tier: row.badges.tier,
          createdAt: row.badges.created_at,
        } : undefined,
      }))
    } catch (error) {
      console.error('Error fetching user badges:', error)
      throw error
    }
  }

  /**
   * Get complete user profile with stats and badges
   */
  async getUserProfile(userId: string, userName: string, tenantId?: string | null): Promise<UserProfile> {
    try {
      const [stats, badges] = await Promise.all([
        this.getUserStats(userId, tenantId),
        this.getUserBadges(userId, tenantId),
      ])

      return {
        userId,
        userName,
        stats: stats!,
        badges,
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      throw error
    }
  }

  /**
   * Get leaderboard (top users by coins)
   */
  async getLeaderboard(tenantId?: string | null, limit: number = 10): Promise<UserProfile[]> {
    try {
      let query = this.supabase
        .from('user_stats')
        .select(`
          *,
          users!user_stats_user_id_fkey (
            id,
            fullName
          )
        `)
        .order('coins', { ascending: false })
        .limit(limit)

      if (tenantId) {
        query = query.eq('tenant_id', tenantId)
      } else {
        query = query.is('tenant_id', null)
      }

      const { data, error } = await query

      if (error) throw error

      const profiles = await Promise.all(
        data.map(async (row: any, index: number) => {
          const badges = await this.getUserBadges(row.user_id, tenantId)
          
          return {
            userId: row.user_id,
            userName: row.users?.fullName || 'Unknown User',
            stats: {
              id: row.id,
              userId: row.user_id,
              tenantId: row.tenant_id,
              totalReactionsReceived: row.total_reactions_received,
              totalReactionsGiven: row.total_reactions_given,
              totalMessages: row.total_messages,
              coins: row.coins,
              createdAt: row.created_at,
              updatedAt: row.updated_at,
            },
            badges,
            rank: index + 1,
          }
        })
      )

      return profiles
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      throw error
    }
  }
}

// Export singleton instance
let _gamificationService: GamificationService | null = null

export const gamificationService = {
  get instance() {
    if (!_gamificationService) {
      _gamificationService = new GamificationService()
    }
    return _gamificationService
  }
}

// Proxy methods
const methodNames = ['getUserStats', 'getAllBadges', 'getUserBadges', 'getUserProfile', 'getLeaderboard'] as const

methodNames.forEach(methodName => {
  (gamificationService as any)[methodName] = function(...args: any[]) {
    return (gamificationService.instance as any)[methodName](...args)
  }
})
