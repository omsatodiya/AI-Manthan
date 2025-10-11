import { getSupabaseClient } from "../database/clients";
import { Tenant, TenantMember, TenantInvitation } from "../types/tenant";

export const tenantFunctions = {
  async findTenantById(id: string): Promise<Tenant | null> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", id)
      .single();
    if (error && error.code !== "PGRST116") console.error(error);
    return data as Tenant | null;
  },

  async findTenantBySlug(slug: string): Promise<Tenant | null> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("slug", slug)
      .single();
    if (error && error.code !== "PGRST116") console.error(error);
    return data as Tenant | null;
  },

  async createTenant(
    tenant: Omit<Tenant, "id" | "createdAt" | "updatedAt">
  ): Promise<Tenant | null> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("tenants")
      .insert(tenant)
      .select()
      .single();
    if (error) console.error(error);
    return data as Tenant | null;
  },

  async updateTenant(
    id: string,
    data: Partial<Tenant>
  ): Promise<Tenant | null> {
    const supabase = await getSupabaseClient();
    const { data: result, error } = await supabase
      .from("tenants")
      .update(data)
      .eq("id", id)
      .select()
      .single();
    if (error) console.error(error);
    return result as Tenant | null;
  },

  async deleteTenant(id: string): Promise<boolean> {
    const supabase = await getSupabaseClient();
    const { error } = await supabase.from("tenants").delete().eq("id", id);
    if (error) console.error(error);
    return !error;
  },

  async getTenantMembers(tenantId: string): Promise<TenantMember[]> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("tenant_members")
      .select(
        `
        *,
        user:users(*),
        tenant:tenants(*)
      `
      )
      .eq("tenant_id", tenantId);
    if (error) console.error(error);
    return (data as TenantMember[]) ?? [];
  },

  async getTenantMembersByUser(userId: string): Promise<TenantMember[]> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("tenant_members")
      .select(
        `
        *,
        user:users(*),
        tenant:tenants(*)
      `
      )
      .eq("user_id", userId);
    if (error) console.error(error);
    return (data as TenantMember[]) ?? [];
  },

  async addTenantMember(
    member: Omit<TenantMember, "id" | "joinedAt">
  ): Promise<TenantMember | null> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("tenant_members")
      .insert({
        user_id: member.userId,
        tenant_id: member.tenantId,
        role: member.role,
        permissions: member.permissions,
      })
      .select(
        `
        *,
        user:users(*),
        tenant:tenants(*)
      `
      )
      .single();
    if (error) console.error(error);
    return data as TenantMember | null;
  },

  async updateTenantMember(
    id: string,
    data: Partial<TenantMember>
  ): Promise<TenantMember | null> {
    const supabase = await getSupabaseClient();
    const { data: result, error } = await supabase
      .from("tenant_members")
      .update(data)
      .eq("id", id)
      .select(
        `
        *,
        user:users(*),
        tenant:tenants(*)
      `
      )
      .single();
    if (error) console.error(error);
    return result as TenantMember | null;
  },

  async removeTenantMember(id: string): Promise<boolean> {
    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from("tenant_members")
      .delete()
      .eq("id", id);
    if (error) console.error(error);
    return !error;
  },

  async createTenantInvitation(
    invitation: Omit<TenantInvitation, "id" | "createdAt">
  ): Promise<TenantInvitation | null> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("tenant_invitations")
      .insert(invitation)
      .select()
      .single();
    if (error) console.error(error);
    return data as TenantInvitation | null;
  },

  async findTenantInvitationByToken(
    token: string
  ): Promise<TenantInvitation | null> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("tenant_invitations")
      .select("*")
      .eq("token", token)
      .single();
    if (error && error.code !== "PGRST116") console.error(error);
    return data as TenantInvitation | null;
  },

  async acceptTenantInvitation(
    token: string,
    userId: string
  ): Promise<TenantMember | null> {
    const supabase = await getSupabaseClient();

    const invitation = await this.findTenantInvitationByToken(token);
    if (!invitation) return null;

    if (new Date(invitation.expiresAt) < new Date()) return null;

    const member = await this.addTenantMember({
      userId,
      tenantId: invitation.tenantId,
      role: invitation.role,
      permissions: [],
    });

    if (member) {
      await supabase
        .from("tenant_invitations")
        .update({ accepted_at: new Date().toISOString() })
        .eq("id", invitation.id);
    }

    return member;
  },

  async deleteTenantInvitation(id: string): Promise<boolean> {
    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from("tenant_invitations")
      .delete()
      .eq("id", id);
    if (error) console.error(error);
    return !error;
  },
};
