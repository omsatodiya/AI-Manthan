'use server'

import { gamificationService } from '@/lib/services/gamification-service'

export async function getUserProfileAction(userId: string, userName: string, tenantId?: string | null) {
  try {
    const profile = await gamificationService.getUserProfile(userId, userName, tenantId)
    return profile
  } catch (error) {
    console.error('Error fetching user profile:', error)
    throw new Error('Failed to fetch user profile')
  }
}

export async function getLeaderboardAction(tenantId?: string | null, limit: number = 50) {
  try {
    const leaderboard = await gamificationService.getLeaderboard(tenantId, limit)
    return leaderboard
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    throw new Error('Failed to fetch leaderboard')
  }
}
