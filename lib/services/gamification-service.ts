import { createClient as createBrowserClient } from '@supabase/supabase-js'
import type { UserStats, Badge, UserBadge, UserProfile, BadgeRequirementType, BadgeTier } from '@/lib/types/gamification'

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
        id: (data as Record<string, unknown>).id as string,
        userId: (data as Record<string, unknown>).user_id as string,
        tenantId: (data as Record<string, unknown>).tenant_id as string,
        totalReactionsReceived: (data as Record<string, unknown>).total_reactions_received as number,
        totalReactionsGiven: (data as Record<string, unknown>).total_reactions_given as number,
        totalMessages: (data as Record<string, unknown>).total_messages as number,
        coins: (data as Record<string, unknown>).coins as number,
        createdAt: (data as Record<string, unknown>).created_at as string,
        updatedAt: (data as Record<string, unknown>).updated_at as string,
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

      return data.map((row: Record<string, unknown>) => ({
        id: row.id as string,
        name: row.name as string,
        description: row.description as string,
        icon: row.icon as string,
        requirementType: row.requirement_type as BadgeRequirementType,
        requirementValue: row.requirement_value as number,
        tier: row.tier as BadgeTier | null,
        createdAt: row.created_at as string,
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

      return data.map((row: Record<string, unknown>) => ({
        id: row.id as string,
        userId: row.user_id as string,
        badgeId: row.badge_id as string,
        tenantId: row.tenant_id as string,
        earnedAt: row.earned_at as string,
        badge: row.badges ? {
          id: (row.badges as Record<string, unknown>).id as string,
          name: (row.badges as Record<string, unknown>).name as string,
          description: (row.badges as Record<string, unknown>).description as string,
          icon: (row.badges as Record<string, unknown>).icon as string,
          requirementType: (row.badges as Record<string, unknown>).requirement_type as BadgeRequirementType,
          requirementValue: (row.badges as Record<string, unknown>).requirement_value as number,
          tier: (row.badges as Record<string, unknown>).tier as BadgeTier | null,
          createdAt: (row.badges as Record<string, unknown>).created_at as string,
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
        data.map(async (row: Record<string, unknown>, index: number) => {
          const badges = await this.getUserBadges(row.user_id as string, tenantId)
          
          return {
            userId: row.user_id as string,
            userName: (row.users as Record<string, unknown>)?.fullName as string || 'Unknown User',
            stats: {
              id: row.id as string,
              userId: row.user_id as string,
              tenantId: row.tenant_id as string,
              totalReactionsReceived: row.total_reactions_received as number,
              totalReactionsGiven: row.total_reactions_given as number,
              totalMessages: row.total_messages as number,
              coins: row.coins as number,
              createdAt: row.created_at as string,
              updatedAt: row.updated_at as string,
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
  },

  async getUserStats(userId: string, tenantId?: string | null) {
    return this.instance.getUserStats(userId, tenantId)
  },

  async getAllBadges() {
    return this.instance.getAllBadges()
  },

  async getUserBadges(userId: string, tenantId?: string | null) {
    return this.instance.getUserBadges(userId, tenantId)
  },

  async getUserProfile(userId: string, userName: string, tenantId?: string | null) {
    return this.instance.getUserProfile(userId, userName, tenantId)
  },

  async getLeaderboard(tenantId?: string | null, limit?: number) {
    return this.instance.getLeaderboard(tenantId, limit)
  }
}
