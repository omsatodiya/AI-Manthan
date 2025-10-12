export interface UserStats {
  id: string;
  userId: string;
  tenantId?: string | null;
  totalReactionsReceived: number;
  totalReactionsGiven: number;
  totalMessages: number;
  coins: number;
  createdAt: string;
  updatedAt: string;
}

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
export type BadgeRequirementType = 'reactions_received' | 'messages_sent' | 'reactions_given';

export interface Badge {
  id: string;
  name: string;
  description?: string | null;
  icon: string;
  requirementType: BadgeRequirementType;
  requirementValue: number;
  tier: BadgeTier | null;
  createdAt: string;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  tenantId?: string | null;
  earnedAt: string;
  badge?: Badge;
}

export interface UserProfile {
  userId: string;
  userName: string;
  stats: UserStats;
  badges: UserBadge[];
  rank?: number;
}
