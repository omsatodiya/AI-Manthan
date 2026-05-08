import { getSupabaseClient } from "../database/clients";
import { Tenant, TenantMember, TenantInvitation, MemberStatus, TenantRole } from "../types/tenant";

// ---------------------------------------------------------------------------
// Types for Raw DB Rows (Internal)
// ---------------------------------------------------------------------------
interface RawTenantMemberRow {
  id: string;
  user_id: string;
  tenant_id: string;
  role: TenantRole;
  status: MemberStatus;
  permissions?: string[] | null;
  joined_at?: string;
  created_at: string;
  user?: {
    id: string;
    full_name?: string;
    fullName?: string;
    name?: string;
    email?: string;
  } | null;
  tenant?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    is_public: boolean;
    settings: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
  } | null;
}

// ---------------------------------------------------------------------------
// Helper: map a raw DB row → TenantMember (handles snake_case DB columns)
// ---------------------------------------------------------------------------
function rowToTenantMember(row: RawTenantMemberRow): TenantMember {
  return {
    id: row.id,
    userId: row.user_id,
    tenantId: row.tenant_id,
    role: row.role,
    status: row.status,
    permissions: row.permissions,
    joinedAt: row.joined_at || row.created_at,
    user: row.user ? {
      id: row.user.id,
      fullName: row.user.full_name || row.user.fullName || row.user.name || "",
      email: row.user.email || "",
    } : null,
    tenant: row.tenant ? {
      id: row.tenant.id,
      name: row.tenant.name,
      slug: row.tenant.slug,
      description: row.tenant.description,
      isPublic: row.tenant.is_public,
      settings: row.tenant.settings,
      createdAt: row.tenant.created_at,
      updatedAt: row.tenant.updated_at,
    } : null,
  };
}

export const tenantFunctions = {
  async findTenantById(id: string): Promise<Tenant | null> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", id)
      .single();
    if (error && error.code !== "PGRST116") console.error(error);
    if (!data) return null;
    return {
      ...data,
      isPublic: data.is_public
    } as Tenant;
  },

  async findTenantBySlug(slug: string): Promise<Tenant | null> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("slug", slug)
      .single();
    if (error && error.code !== "PGRST116") console.error(error);
    if (!data) return null;
    return {
      ...data,
      isPublic: data.is_public
    } as Tenant;
  },

  async createTenant(
    tenant: Omit<Tenant, "id" | "createdAt" | "updatedAt">
  ): Promise<Tenant | null> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("tenants")
      .insert({
        name: tenant.name,
        slug: tenant.slug,
        description: tenant.description,
        is_public: tenant.isPublic,
        settings: tenant.settings,
      })
      .select()
      .single();
    if (error) console.error(error);
    if (!data) return null;
    return {
      ...data,
      isPublic: data.is_public
    } as Tenant;
  },

  async updateTenant(
    id: string,
    data: Partial<Tenant>
  ): Promise<Tenant | null> {
    const supabase = await getSupabaseClient();
    const updatePayload: Record<string, unknown> = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.slug !== undefined) updatePayload.slug = data.slug;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.isPublic !== undefined) updatePayload.is_public = data.isPublic;
    if (data.settings !== undefined) updatePayload.settings = data.settings;

    const { data: result, error } = await supabase
      .from("tenants")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();
    if (error) console.error(error);
    if (!result) return null;
    return {
      ...result,
      isPublic: result.is_public
    } as Tenant;
  },

  async deleteTenant(id: string): Promise<boolean> {
    const supabase = await getSupabaseClient();
    const { error } = await supabase.from("tenants").delete().eq("id", id);
    if (error) console.error(error);
    return !error;
  },

  async getTenantMembers(tenantId: string, status?: MemberStatus): Promise<TenantMember[]> {
    const supabase = await getSupabaseClient();
    let query = supabase
      .from("tenant_members")
      .select(
        `
        *,
        user:users(*),
        tenant:tenants(*)
      `
      )
      .eq("tenant_id", tenantId);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) console.error(error);
    return ((data as RawTenantMemberRow[] | null) ?? []).map(rowToTenantMember);
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
    return ((data as RawTenantMemberRow[] | null) ?? []).map(rowToTenantMember);
  },

  async getManagedTenants(userId: string): Promise<TenantMember[]> {
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
      .eq("user_id", userId)
      .in("role", ["owner", "admin"])
      .eq("status", "active");
    if (error) console.error(error);
    return ((data as RawTenantMemberRow[] | null) ?? []).map(rowToTenantMember);
  },

  async findTenantMemberById(id: string): Promise<TenantMember | null> {
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
      .eq("id", id)
      .single();
    if (error && error.code !== "PGRST116") console.error(error);
    if (!data) return null;
    return rowToTenantMember(data as RawTenantMemberRow);
  },

  async addTenantMember(
    member: Omit<TenantMember, "id" | "joinedAt" | "user" | "tenant">
  ): Promise<TenantMember | null> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("tenant_members")
      .insert({
        user_id: member.userId,
        tenant_id: member.tenantId,
        role: member.role,
        status: member.status,
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
    if (!data) return null;
    return rowToTenantMember(data as RawTenantMemberRow);
  },

  async updateTenantMember(
    id: string,
    data: Partial<Omit<TenantMember, "user" | "tenant">>
  ): Promise<TenantMember | null> {
    const supabase = await getSupabaseClient();
    const updatePayload: Record<string, unknown> = {};
    if (data.role !== undefined) updatePayload.role = data.role;
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.permissions !== undefined) updatePayload.permissions = data.permissions;
    if (data.userId !== undefined) updatePayload.user_id = data.userId;
    if (data.tenantId !== undefined) updatePayload.tenant_id = data.tenantId;

    const { data: result, error } = await supabase
      .from("tenant_members")
      .update(updatePayload)
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
    if (!result) return null;
    return rowToTenantMember(result as RawTenantMemberRow);
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
      .insert({
        tenant_id: invitation.tenantId,
        email: invitation.email,
        role: invitation.role,
        invited_by: invitation.invitedBy,
        token: invitation.token,
        expires_at: invitation.expiresAt,
        accepted_at: invitation.acceptedAt,
      })
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
      status: "active",
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

  async getPublicTenants(): Promise<Tenant[]> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("is_public", true)
      .order("name", { ascending: true });
    if (error) console.error(error);
    return (data || []).map((t: Record<string, unknown>) => ({
      ...t,
      isPublic: t.is_public,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    } as unknown as Tenant));
  },

  async getPaginatedTenantMembers({
    tenantId,
    pageIndex,
    pageSize,
    query,
    sort,
  }: {
    tenantId: string;
    pageIndex: number;
    pageSize: number;
    query?: string;
    sort?: { id: string; desc: boolean };
  }) {
    const supabase = await getSupabaseClient();
    
    let queryBuilder = supabase
      .from("tenant_members")
      .select(`
        *,
        user:users!inner(*),
        tenant:tenants(*)
      `, { count: "exact" })
      .eq("tenant_id", tenantId);

    if (query) {
      queryBuilder = queryBuilder.or(
        `full_name.ilike.%${query}%,email.ilike.%${query}%`,
        { foreignTable: "users" }
      );
    }

    if (sort) {
      let sortKey = sort.id;
      if (sortKey === "joinedAt") sortKey = "created_at";
      if (["role", "status", "created_at"].includes(sortKey)) {
        queryBuilder = queryBuilder.order(sortKey, { ascending: !sort.desc });
      }
    } else {
      queryBuilder = queryBuilder.order("created_at", { ascending: false });
    }

    const { data, error, count } = await queryBuilder.range(
      pageIndex * pageSize,
      (pageIndex + 1) * pageSize - 1
    );

    if (error) console.error(error);

    const members = ((data as RawTenantMemberRow[] | null) ?? []).map(rowToTenantMember);

    return {
      members,
      totalCount: count ?? 0,
      pageCount: count ? Math.ceil(count / pageSize) : 0,
    };
  }
};
