import { getSupabaseClient } from "../database/clients";
import { UserInfo } from "../types/user-info";
import { UserMatch } from "../types/database";

export const userInfoFunctions = {
  async getUserInfo(
    userId: string,
    tenantId?: string
  ): Promise<UserInfo | null> {
    const supabase = await getSupabaseClient();

    const { data: initialData, error: initialError } = await supabase
      .from("user_info")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    let data = initialData;
    const error = initialError;
    if (!error && tenantId) {
      const scoped = await supabase
        .from("user_info")
        .select("*")
        .eq("user_id", userId)
        .eq("tenant_id", tenantId)
        .maybeSingle();
      if (!scoped.error) {
        data = scoped.data;
      } else if (
        scoped.error.code === "42703" ||
        scoped.error.code === "PGRST204"
      ) {
      } else {
        console.error(scoped.error);
      }
    } else if (error && error.code !== "PGRST116") {
      console.error(error);
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

  async createUserInfo(
    userInfo: Omit<UserInfo, "id" | "createdAt" | "updatedAt">
  ): Promise<UserInfo | null> {
    const supabase = await getSupabaseClient();
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
    const {
      data: firstInsertData,
      error: firstInsertError,
    } = await supabase
      .from("user_info")
      .insert({ ...insertBase, tenant_id: userInfo.tenantId ?? null })
      .select()
      .single();
    let data = firstInsertData;
    const error = firstInsertError;
    if (
      error &&
      (error as { code?: string }).code &&
      ((error as { code?: string }).code === "42703" ||
        (error as { code?: string }).code === "PGRST204")
    ) {
      const retry = await supabase
        .from("user_info")
        .insert(insertBase)
        .select()
        .single();
      data = retry.data;
    }
    if (error) console.error(error);

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

  async updateUserInfo(
    userId: string,
    userInfoData: Partial<
      Omit<UserInfo, "id" | "userId" | "createdAt" | "updatedAt">
    >,
    tenantId?: string
  ): Promise<UserInfo | null> {
    const supabase = await getSupabaseClient();
    console.log("🔵 updateUserInfo: Starting update", { userId, tenantId, hasEmbedding: !!userInfoData.embedding });
    
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

    const {
      data: firstUpdateData,
      error: firstUpdateError,
    } = await supabase
      .from("user_info")
      .update(updateData)
      .eq("user_id", userId)
      .select()
      .maybeSingle();
    let data = firstUpdateData;
    const error = firstUpdateError;
    if (
      error &&
      (error as { code?: string }).code &&
      ((error as { code?: string }).code === "42703" ||
        (error as { code?: string }).code === "PGRST204")
    ) {
      const retry = await supabase
        .from("user_info")
        .update(updateData)
        .eq("user_id", userId)
        .select()
        .maybeSingle();
      data = retry.data;
    }
    if (error) console.error(error);

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
    console.log("🔵 findUserMatches: Starting user matching", {
      userId,
      embeddingLength: embedding.length,
      options
    });

    const supabase = await getSupabaseClient();

    try {
      // Call the database function to find matches using vector similarity
      const { data: matches, error: matchError } = await supabase.rpc('match_users', {
        query_embedding: embedding,
        match_user_id: userId,
        match_threshold: options.threshold,
        match_count: options.limit
      });

      if (matchError) {
        console.error("🔴 findUserMatches: Database function error", matchError);
        throw matchError;
      }

      console.log("🔵 findUserMatches: Raw matches from database", {
        matchCount: matches?.length || 0,
        matches: matches?.map((m: { user_id: string; similarity: number }) => ({
          userId: m.user_id,
          similarity: m.similarity
        }))
      });

      if (!matches || matches.length === 0) {
        console.log("🔵 findUserMatches: No matches found");
        return [];
      }

      // Get user details for the matched users
      const userIds = matches.map((match: { user_id: string; similarity: number }) => match.user_id);
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds);

      if (usersError) {
        console.error("🔴 findUserMatches: Error fetching user details", usersError);
        // Return matches without user details if we can't fetch them
        return matches.map((match: { user_id: string; similarity: number }) => ({
          userId: match.user_id,
          similarity: match.similarity
        }));
      }

      console.log("🔵 findUserMatches: User details fetched", {
        userCount: users?.length || 0
      });

      // Combine match data with user details
      const detailedMatches: UserMatch[] = matches.map((match: { user_id: string; similarity: number }) => ({
        userId: match.user_id,
        similarity: match.similarity,
        user: users?.find(u => u.id === match.user_id) || undefined
      }));

      console.log("🔵 findUserMatches: Final matches prepared", {
        matchCount: detailedMatches.length,
        matchesWithDetails: detailedMatches.filter(m => m.user).length
      });

      return detailedMatches;

    } catch (error) {
      console.error("🔴 findUserMatches: Error in matching process", error);
      throw error;
    }
  },
};
