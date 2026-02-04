import { getSupabaseClient } from "../database/clients";
import { User } from "../types/user";

export const userFunctions = {
  async findUserByEmail(email: string): Promise<User | null> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();
    if (error && error.code !== "PGRST116") console.error(error);
    if (!data) return null;
    
    const row = data as Record<string, unknown>;
    const fullName = (row.full_name ?? row.fullName) as string;
    return {
      id: row.id as string,
      fullName,
      email: row.email as string,
      passwordHash: (row.password_hash ?? row.passwordHash) as string,
      role: row.role as "admin" | "user",
      tenantId: (row.tenant_id ?? null) as string | null,
      otp: (row.otp ?? null) as string | null,
      otpExpires: (row.otp_expires ?? row.otpExpires ?? null) as number | null,
      createdAt: (row.created_at ?? row.createdAt) as string,
      updatedAt: (row.updated_at ?? row.updatedAt) as string,
    } as User;
  },

  async findUserByEmailInTenant(
    email: string,
    tenantId: string
  ): Promise<User | null> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("tenant_id", tenantId)
      .single();
    if (error && error.code !== "PGRST116") console.error(error);
    if (!data) return null;
    const row = data as Record<string, unknown>;
    return {
      id: row.id as string,
      fullName: (row.full_name ?? row.fullName) as string,
      email: row.email as string,
      passwordHash: (row.password_hash ?? row.passwordHash) as string,
      role: row.role as "admin" | "user",
      tenantId: (row.tenant_id ?? null) as string | null,
      otp: (row.otp ?? null) as string | null,
      otpExpires: (row.otp_expires ?? row.otpExpires ?? null) as number | null,
      createdAt: (row.created_at ?? row.createdAt) as string,
      updatedAt: (row.updated_at ?? row.updatedAt) as string,
    } as User;
  },

  async findUserById(id: string): Promise<User | null> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();
    if (error && error.code !== "PGRST116") console.error(error);
    if (!data) return null;
    const row = data as Record<string, unknown>;
    return {
      id: row.id as string,
      fullName: (row.full_name ?? row.fullName) as string,
      email: row.email as string,
      passwordHash: (row.password_hash ?? row.passwordHash) as string,
      role: row.role as "admin" | "user",
      tenantId: (row.tenant_id ?? null) as string | null,
      otp: (row.otp ?? null) as string | null,
      otpExpires: (row.otp_expires ?? row.otpExpires ?? null) as number | null,
      createdAt: (row.created_at ?? row.createdAt) as string,
      updatedAt: (row.updated_at ?? row.updatedAt) as string,
    } as User;
  },

  async createUser(
    user: Omit<User, "otp" | "otpExpires" | "createdAt" | "updatedAt">
  ): Promise<User | null> {
    const supabase = await getSupabaseClient();
    const nowIso = new Date().toISOString();
    const insertPayload = {
      id: user.id,
      full_name: user.fullName,
      email: user.email.toLowerCase(),
      password_hash: user.passwordHash,
      role: user.role,
      created_at: nowIso,
      updated_at: nowIso,
      tenant_id: user.tenantId ?? null,
    } as Record<string, unknown>;
    const { data, error } = await supabase
      .from("users")
      .insert(insertPayload)
      .select()
      .single();
    if (error) console.error(error);
    if (!data) return null;
    const row = data as Record<string, unknown>;
    return {
      id: row.id as string,
      fullName: (row.full_name ?? row.fullName) as string,
      email: row.email as string,
      passwordHash: (row.password_hash ?? row.passwordHash) as string,
      role: row.role as "admin" | "user",
      tenantId: (row.tenant_id ?? null) as string | null,
      otp: (row.otp ?? null) as string | null,
      otpExpires: (row.otp_expires ?? row.otpExpires ?? null) as number | null,
      createdAt: (row.created_at ?? row.createdAt) as string,
      updatedAt: (row.updated_at ?? row.updatedAt) as string,
    } as User;
  },

  async updateUser(id: string, userData: Partial<User>): Promise<User | null> {
    const supabase = await getSupabaseClient();
    const updatePayload: Record<string, unknown> = {};
    if (userData.fullName !== undefined)
      updatePayload.full_name = userData.fullName;
    if (userData.email !== undefined)
      updatePayload.email = userData.email.toLowerCase();
    if (userData.passwordHash !== undefined)
      updatePayload.password_hash = userData.passwordHash;
    if (userData.role !== undefined) updatePayload.role = userData.role;
    if (userData.tenantId !== undefined)
      updatePayload.tenant_id = userData.tenantId;
    if (userData.otp !== undefined) updatePayload.otp = userData.otp;
    if (userData.otpExpires !== undefined)
      updatePayload.otp_expires = userData.otpExpires;
    if (userData.updatedAt !== undefined)
      updatePayload.updated_at = userData.updatedAt;

    const { data, error } = await supabase
      .from("users")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();
    if (error) console.error(error);
    if (!data) return null;
    const row = data as Record<string, unknown>;
    return {
      id: row.id as string,
      fullName: (row.full_name ?? row.fullName) as string,
      email: row.email as string,
      passwordHash: (row.password_hash ?? row.passwordHash) as string,
      role: row.role as "admin" | "user",
      tenantId: (row.tenant_id ?? null) as string | null,
      otp: (row.otp ?? null) as string | null,
      otpExpires: (row.otp_expires ?? row.otpExpires ?? null) as number | null,
      createdAt: (row.created_at ?? row.createdAt) as string,
      updatedAt: (row.updated_at ?? row.updatedAt) as string,
    } as User;
  },

  async deleteUserById(id: string): Promise<boolean> {
    const supabase = await getSupabaseClient();
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) console.error(error);
    return !error;
  },

  async setUserTenantId(
    userId: string,
    tenantId: string | null
  ): Promise<boolean> {
    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from("users")
      .update({ tenant_id: tenantId })
      .eq("id", userId);
    if (error) console.error(error);
    return !error;
  },

  async getAdminAnalytics(tenantId?: string) {
    const supabase = await getSupabaseClient();
    if (tenantId) {
      const usersQuery = supabase
        .from("users")
        .select("id", { count: "exact" })
        .eq("tenant_id", tenantId)
        .range(0, 0);

      const adminsQuery = supabase
        .from("users")
        .select("id", { count: "exact" })
        .eq("tenant_id", tenantId)
        .eq("role", "admin")
        .range(0, 0);

      const [
        { count: totalUsers, error: totalError },
        { count: totalAdmins, error: adminsError },
      ] = await Promise.all([usersQuery, adminsQuery]);
      if (totalError || adminsError) console.error(totalError || adminsError);
      return { totalUsers: totalUsers ?? 0, totalAdmins: totalAdmins ?? 0 };
    }

    const usersQuery = supabase
      .from("users")
      .select("id", { count: "exact" })
      .range(0, 0);
    const adminsQuery = supabase
      .from("users")
      .select("id", { count: "exact" })
      .eq("role", "admin")
      .range(0, 0);

    const [
      { count: totalUsers, error: totalError },
      { count: totalAdmins, error: adminError },
    ] = await Promise.all([usersQuery, adminsQuery]);
    if (totalError || adminError) console.error(totalError || adminError);
    return { totalUsers: totalUsers ?? 0, totalAdmins: totalAdmins ?? 0 };
  },

  async getPaginatedUsers({
    pageIndex,
    pageSize,
    query,
    sort,
    tenantId,
  }: {
    pageIndex: number;
    pageSize: number;
    query?: string;
    sort?: { id: string; desc: boolean };
    tenantId?: string;
  }) {
    const supabase = await getSupabaseClient();
    let queryBuilder = supabase.from("users").select("*", { count: "exact" });
    if (tenantId) {
      queryBuilder = queryBuilder.eq("tenant_id", tenantId);
    }

    if (query) {
      queryBuilder = queryBuilder.or(
        `fullName.ilike.%${query}%,email.ilike.%${query}%`
      );
    }
    if (sort) {
      queryBuilder = queryBuilder.order(sort.id, { ascending: !sort.desc });
    }

    const { data, error, count } = await queryBuilder.range(
      pageIndex * pageSize,
      (pageIndex + 1) * pageSize - 1
    );
    if (error) console.error(error);

    return {
      users: (data as User[]) ?? [],
      totalCount: count ?? 0,
      pageCount: count ? Math.ceil(count / pageSize) : 0,
    };
  },
};
