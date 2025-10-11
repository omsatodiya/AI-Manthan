import { getSupabaseClient } from "../database/clients";
import { UserInfo } from "../types/user-info";

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
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>;

    const {
      data: firstUpdateData,
      error: firstUpdateError,
    } = await supabase
      .from("user_info")
      .update(updateData)
      .eq("user_id", userId)
      .eq("tenant_id", tenantId ?? null)
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
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as UserInfo;
  },
};
