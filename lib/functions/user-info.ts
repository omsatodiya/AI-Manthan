import { getSupabaseClient } from "../database/clients";
import { UserInfo } from "../types/user-info";

export const userInfoFunctions = {
  async getUserInfo(
    userId: string,
    tenantId?: string
  ): Promise<UserInfo | null> {
    const supabase = await getSupabaseClient();
    let query = supabase.from("user_info").select("*").eq("user_id", userId);

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    } else {
      query = query.is("tenant_id", null);
    }

    const { data, error } = await query.single();
    if (error && error.code !== "PGRST116") console.error(error);

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
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as UserInfo;
  },

  async createUserInfo(
    userInfo: Omit<UserInfo, "id" | "createdAt" | "updatedAt">
  ): Promise<UserInfo | null> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("user_info")
      .insert({
        user_id: userInfo.userId,
        tenant_id: userInfo.tenantId,
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
      })
      .select()
      .single();
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
    let query = supabase
      .from("user_info")
      .update({
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
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    } else {
      query = query.is("tenant_id", null);
    }

    const { data, error } = await query.select().single();
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
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as UserInfo;
  },
};
