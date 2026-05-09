import { createClient } from "@supabase/supabase-js";
import { UserInfo } from "../types/user-info";
import { UserMatch } from "../types/database";

function getSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("Supabase URL and service key required");
  return createClient(url, key);
}

export const userInfoFunctions = {
  async getUserInfo(
    userId: string
  ): Promise<UserInfo | null> {
    const supabase = getSupabaseServiceClient();

    const { data, error } = await supabase
      .from("user_info")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("getUserInfo error:", error);
    }

    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      role: data.role,
      organizationType: data.organization_type,
      businessStage: data.business_stage,
      teamSize: data.team_size,
      industry: data.industry,
      goals: data.goals,
      opportunityType: data.opportunity_type,
      focusAreas: data.focus_areas,
      collabTarget: data.collab_target,
      collabType: data.collab_type,
      partnershipOpen: data.partnership_open,
      templateType: data.template_type,
      templateTone: data.template_tone,
      templateAutomation: data.template_automation,
      eventType: data.event_type,
      eventScale: data.event_scale,
      eventFormat: data.event_format,
      embedding: data.embedding,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as UserInfo;
  },

  async createUserInfo(
    userInfo: Omit<UserInfo, "id" | "createdAt" | "updatedAt">
  ): Promise<UserInfo | null> {
    const supabase = getSupabaseServiceClient();
    const insertBase: Record<string, unknown> = {
      user_id: userInfo.userId,
      role: userInfo.role,
      organization_type: userInfo.organizationType,
      business_stage: userInfo.businessStage,
      team_size: userInfo.teamSize,
      industry: userInfo.industry,
      goals: userInfo.goals,
      opportunity_type: userInfo.opportunityType,
      focus_areas: userInfo.focusAreas,
      collab_target: userInfo.collabTarget,
      collab_type: userInfo.collabType,
      partnership_open: userInfo.partnershipOpen,
      template_type: userInfo.templateType,
      template_tone: userInfo.templateTone,
      template_automation: userInfo.templateAutomation,
      event_type: userInfo.eventType,
      event_scale: userInfo.eventScale,
      event_format: userInfo.eventFormat,
    };
    const { data, error } = await supabase
      .from("user_info")
      .insert(insertBase)
      .select()
      .single();

    if (error) {
      console.error("createUserInfo failed:", error);
    }

    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      role: data.role,
      organizationType: data.organization_type,
      businessStage: data.business_stage,
      teamSize: data.team_size,
      industry: data.industry,
      goals: data.goals,
      opportunityType: data.opportunity_type,
      focusAreas: data.focus_areas,
      collabTarget: data.collab_target,
      collabType: data.collab_type,
      partnershipOpen: data.partnership_open,
      templateType: data.template_type,
      templateTone: data.template_tone,
      templateAutomation: data.template_automation,
      eventType: data.event_type,
      eventScale: data.event_scale,
      eventFormat: data.event_format,
      embedding: data.embedding,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as UserInfo;
  },

  async updateUserInfo(
    userId: string,
    userInfoData: Partial<
      Omit<UserInfo, "id" | "userId" | "createdAt" | "updatedAt">
    >
  ): Promise<UserInfo | null> {
    const supabase = getSupabaseServiceClient();
    
    const updateData = {
      role: userInfoData.role,
      organization_type: userInfoData.organizationType,
      business_stage: userInfoData.businessStage,
      team_size: userInfoData.teamSize,
      industry: userInfoData.industry,
      goals: userInfoData.goals,
      opportunity_type: userInfoData.opportunityType,
      focus_areas: userInfoData.focusAreas,
      collab_target: userInfoData.collabTarget,
      collab_type: userInfoData.collabType,
      partnership_open: userInfoData.partnershipOpen,
      template_type: userInfoData.templateType,
      template_tone: userInfoData.templateTone,
      template_automation: userInfoData.templateAutomation,
      event_type: userInfoData.eventType,
      event_scale: userInfoData.eventScale,
      event_format: userInfoData.eventFormat,
      embedding: userInfoData.embedding,
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>;

    const query = supabase.from("user_info").update(updateData).eq("user_id", userId);
    const { data, error } = await query
      .select()
      .maybeSingle();

    if (error) {
      console.error("updateUserInfo failed:", error);
    }

    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      tenantId: data.tenant_id,
      role: data.role,
      organizationType: data.organization_type,
      businessStage: data.business_stage,
      teamSize: data.team_size,
      industry: data.industry,
      goals: data.goals,
      opportunityType: data.opportunity_type,
      focusAreas: data.focus_areas,
      collabTarget: data.collab_target,
      collabType: data.collab_type,
      partnershipOpen: data.partnership_open,
      templateType: data.template_type,
      templateTone: data.template_tone,
      templateAutomation: data.template_automation,
      eventType: data.event_type,
      eventScale: data.event_scale,
      eventFormat: data.event_format,
      embedding: data.embedding,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as UserInfo;
  },

  async findUserMatches(
    userId: string,
    embedding: number[],
    options: {
      threshold: number;
      limit: number;
      tenantId?: string;
    }
  ): Promise<UserMatch[]> {

    const supabase = getSupabaseServiceClient();

    try {
      // Call the database function to find matches using vector similarity
      const { data: matches, error: matchError } = await supabase.rpc('match_users', {
        query_embedding: embedding,
        match_user_id: userId,
        match_threshold: options.threshold,
        match_count: options.limit,
        match_tenant_id: options.tenantId || null
      });

      if (matchError) {
        console.error("🔴 findUserMatches: Database function error", matchError);

        // Fallback: Try direct query if RPC function fails
        console.log("🔶 findUserMatches: Trying direct query fallback");
        const { data: directMatches, error: directError } = await supabase
          .from('user_info')
          .select('user_id, embedding')
          .neq('user_id', userId)
          .not('embedding', 'is', null);

        if (directError) {
          console.error("🔴 findUserMatches: Direct query also failed", directError);
          throw matchError; // Throw original error
        }

        // Process direct matches manually (cosine similarity calculation)
        const processedMatches = directMatches
          ?.map((match: { user_id: string; embedding: number[] }) => {
            if (!match.embedding || !Array.isArray(match.embedding)) return null;
            
            // Calculate cosine similarity
            const dotProduct = embedding.reduce((sum, val, i) => sum + val * match.embedding[i], 0);
            const magnitude1 = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
            const magnitude2 = Math.sqrt(match.embedding.reduce((sum: number, val: number) => sum + val * val, 0));
            const similarity = dotProduct / (magnitude1 * magnitude2);

            if (similarity > options.threshold) {
              return {
                user_id: match.user_id,
                similarity: similarity
              };
            }
            return null;
          })
          .filter((match): match is { user_id: string; similarity: number } => match !== null)
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, options.limit) || [];

        console.log("🔵 findUserMatches: Fallback matches processed", {
          matchCount: processedMatches.length,
          matches: processedMatches
        });

        // Get user details for fallback matches
        const fallbackUserIds = processedMatches.map((match: { user_id: string }) => match.user_id);
        
        // If a tenantId is provided, filter fallback matches by membership first
        let matchedUserIds = fallbackUserIds;
        if (options.tenantId) {
          const { data: memberRows } = await supabase
            .from('tenant_members')
            .select('user_id')
            .eq('tenant_id', options.tenantId)
            .eq('status', 'active')
            .in('user_id', fallbackUserIds);
          
          matchedUserIds = (memberRows ?? []).map(r => r.user_id);
        }

        if (matchedUserIds.length === 0) return [];

        const { data: fallbackUsers, error: fallbackUsersError } = await supabase
          .from('users')
          .select('id, full_name, email')
          .in('id', matchedUserIds);

        if (fallbackUsersError) {
          console.error("🔴 findUserMatches: Error fetching fallback user details", fallbackUsersError);
          return processedMatches.map((match: { user_id: string; similarity: number }) => ({
            userId: match.user_id,
            similarity: match.similarity
          }));
        }

        const toUserName = (u: { full_name?: string; fullName?: string }) =>
          u?.full_name ?? (u as { fullName?: string })?.fullName ?? "Unknown User";

        const fallbackDetailedMatches: UserMatch[] = processedMatches.map((match: { user_id: string; similarity: number }) => {
          const foundUser = fallbackUsers?.find(u => u.id === match.user_id);
          return {
            userId: match.user_id,
            similarity: match.similarity,
            tenantId: options.tenantId || null,
            user: foundUser ? {
              id: foundUser.id,
              name: toUserName(foundUser),
              email: foundUser.email,
              tenantId: options.tenantId
            } : undefined
          };
        });

        return fallbackDetailedMatches;
      }

      console.log("🔵 findUserMatches: Raw matches from database", {
        matchCount: matches?.length || 0,
        rawMatches: matches
      });

      if (!matches || matches.length === 0) {
        return [];
      }

      // Get user details for the matched users
      const userIds = matches.map((match: { userId?: string; user_id?: string }) => match.userId || match.user_id);
      console.log("🔵 findUserMatches: Extracted user IDs", { userIds });
      
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', userIds);

      console.log("🔵 findUserMatches: User details fetched", {
        userCount: users?.length || 0,
        users: users
      });

      if (usersError) {
        console.error("🔴 findUserMatches: Error fetching user details", usersError);
        return matches.map((match: { userId?: string; user_id?: string; similarity: number }) => ({
          userId: match.userId || match.user_id,
          similarity: match.similarity
        }));
      }

      const toUserName = (u: { full_name?: string; fullName?: string }) =>
        u?.full_name ?? (u as { fullName?: string })?.fullName ?? "Unknown User";

      const detailedMatches: UserMatch[] = matches.map((match: { userId?: string; user_id?: string; similarity: number }) => {
        const userId = match.userId || match.user_id;
        const foundUser = users?.find(u => u.id === userId);

        return {
          userId: userId,
          similarity: match.similarity,
          tenantId: options.tenantId || null,
          user: foundUser ? {
            id: foundUser.id,
            name: toUserName(foundUser),
            email: foundUser.email,
            tenantId: options.tenantId
          } : undefined
        };
      });


      return detailedMatches;

    } catch (error) {
      throw error;
    }
  },
};
