import { getSupabaseClient } from "../database/clients";
import { User } from "../types/user";

// ---------------------------------------------------------------------------
// Helper: map a raw DB row → User (handles snake_case DB columns)
// ---------------------------------------------------------------------------
function rowToUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    fullName: (row.full_name ?? row.fullName ?? row.name ?? "") as string,
    email: (row.email ?? "") as string,
    passwordHash: (row.password_hash ?? row.passwordHash ?? "") as string,
    otp: (row.otp ?? null) as string | null,
    otpExpires: (row.otp_expires ?? row.otpExpires ?? null) as number | null,
    createdAt: (row.created_at ?? row.createdAt ?? "") as string,
    updatedAt: (row.updated_at ?? row.updatedAt ?? "") as string,
  };
}

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
    return rowToUser(data as Record<string, unknown>);
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
    return rowToUser(data as Record<string, unknown>);
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
      created_at: nowIso,
      updated_at: nowIso,
    } as Record<string, unknown>;
    const { data, error } = await supabase
      .from("users")
      .insert(insertPayload)
      .select()
      .single();
    if (error) console.error(error);
    if (!data) return null;
    return rowToUser(data as Record<string, unknown>);
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
    if (userData.otp !== undefined) updatePayload.otp = userData.otp;
    if (userData.otpExpires !== undefined)
      updatePayload.otp_expires = userData.otpExpires;
    if (userData.updatedAt !== undefined)
      updatePayload.updated_at = userData.updatedAt;
    else
      updatePayload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("users")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();
    if (error) console.error(error);
    if (!data) return null;
    return rowToUser(data as Record<string, unknown>);
  },

  async deleteUserById(id: string): Promise<boolean> {
    const supabase = await getSupabaseClient();
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) console.error(error);
    return !error;
  },

  async getAdminAnalytics(tenantId?: string) {
    const supabase = await getSupabaseClient();
    if (tenantId) {
      const { count: totalUsers, error: totalError } = await supabase
        .from("tenant_members")
        .select("id", { count: "exact" })
        .eq("tenant_id", tenantId)
        .eq("status", "active")
        .range(0, 0);

      const { count: totalAdmins, error: adminsError } = await supabase
        .from("tenant_members")
        .select("id", { count: "exact" })
        .eq("tenant_id", tenantId)
        .eq("status", "active")
        .in("role", ["owner", "admin"])
        .range(0, 0);

      if (totalError || adminsError) console.error(totalError || adminsError);
      return { totalUsers: totalUsers ?? 0, totalAdmins: totalAdmins ?? 0 };
    }

    const { count: totalUsers, error: totalError } = await supabase
      .from("users")
      .select("id", { count: "exact" })
      .range(0, 0);

    if (totalError) console.error(totalError);
    return { totalUsers: totalUsers ?? 0, totalAdmins: 0 };
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
    
    if (tenantId) {
      let memberQuery = supabase
        .from("tenant_members")
        .select("user:users(*)", { count: "exact" })
        .eq("tenant_id", tenantId)
        .eq("status", "active");

      if (query) {
         memberQuery = supabase
          .from("tenant_members")
          .select("user:users!inner(*)", { count: "exact" })
          .eq("tenant_id", tenantId)
          .eq("status", "active")
          .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`, { foreignTable: "users" });
      }

      const { data, error, count } = await memberQuery.range(
        pageIndex * pageSize,
        (pageIndex + 1) * pageSize - 1
      );
      if (error) console.error(error);

      const users = ((data as { user: Record<string, unknown> }[] | null) ?? [])
        .map((row) => rowToUser(row.user))
        .filter(Boolean);

      return {
        users,
        totalCount: count ?? 0,
        pageCount: count ? Math.ceil(count / pageSize) : 0,
      };
    }

    // Global paginated users
    let queryBuilder = supabase.from("users").select("*", { count: "exact" });
    if (query) {
      queryBuilder = queryBuilder.or(
        `full_name.ilike.%${query}%,email.ilike.%${query}%`
      );
    }
    if (sort) {
      const sortKey = sort.id === "fullName" ? "full_name" : sort.id;
      queryBuilder = queryBuilder.order(sortKey, { ascending: !sort.desc });
    }

    const { data, error, count } = await queryBuilder.range(
      pageIndex * pageSize,
      (pageIndex + 1) * pageSize - 1
    );
    if (error) console.error(error);

    const users = ((data as Record<string, unknown>[] | null) ?? []).map(rowToUser);

    return {
      users,
      totalCount: count ?? 0,
      pageCount: count ? Math.ceil(count / pageSize) : 0,
    };
  },
};
