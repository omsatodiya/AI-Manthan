"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/database";
import { GetUsersParams } from "@/lib/types";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { getCurrentUserAction } from "./auth";

export async function getAdminAnalyticsAction() {
  const db = await getDb();
  const currentUser = await getCurrentUserAction();
  const tenantId = currentUser?.tenantId;
  return db.getAdminAnalytics(tenantId || undefined);
}

export async function getUsersAction(params: GetUsersParams) {
  const db = await getDb();

  const currentUser = await getCurrentUserAction();
  const tenantId = currentUser?.tenantId || undefined;
  return db.getPaginatedUsers({ ...params, tenantId });
}

export async function createAdminUserAction(data: {
  fullName: string;
  email: string;
  role: "admin" | "user";
  password?: string;
}) {
  const db = await getDb();
  const existingUser = await db.findUserByEmail(data.email);
  if (existingUser)
    return { success: false, message: "User with this email already exists." };

  const password = data.password || Math.random().toString(36).slice(-12);
  const passwordHash = await bcrypt.hash(password, 10);

  let tenantId: string | undefined;
  try {
    const { headers, cookies } = await import("next/headers");
    const hdrs = await headers();
    const host = hdrs.get("host") || "";
    const parts = host.split(":")[0].split(".");
    const subdomain = parts.length > 2 ? parts[0].toLowerCase() : null;
    if (subdomain) {
      const supabase = await import("@/lib/database/clients").then((m) =>
        m.getSupabaseClient()
      );
      const { data } = await (await supabase)
        .from("tenants")
        .select("id")
        .eq("slug", subdomain)
        .single();
      tenantId = (data as { id: string } | null)?.id || undefined;
    } else if (process.env.NODE_ENV !== "production" && process.env.TENANT) {
      const supabase = await import("@/lib/database/clients").then((m) =>
        m.getSupabaseClient()
      );
      const { data } = await (await supabase)
        .from("tenants")
        .select("id")
        .eq("slug", process.env.TENANT.toLowerCase())
        .single();
      tenantId = (data as { id: string } | null)?.id || undefined;
    } else {
      const cookieStore = await cookies();
      const token = cookieStore.get("auth_token")?.value;
      if (token) {
        const { jwtVerify } = await import("jose");
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
        const { payload } = await jwtVerify(token, secret);
        interface AuthJWTPayload {
          tenantId?: string;
        }
        const p = payload as AuthJWTPayload;
        tenantId = p.tenantId || undefined;
      }
    }
  } catch {}

  const newUser = {
    id: uuidv4(),
    fullName: data.fullName,
    email: data.email.toLowerCase(),
    role: data.role,
    passwordHash,
    tenantId,
  };

  await db.createUser(newUser);
  revalidatePath("/admin/users");
  return {
    success: true,
    message: `User created. Initial password: ${password}`,
  };
}

export async function updateAdminUserAction(
  id: string,
  data: { fullName: string; role: "admin" | "user" }
) {
  const db = await getDb();
  await db.updateUser(id, data);
  revalidatePath("/admin/users");
  return { success: true, message: "User updated successfully." };
}

export async function deleteAdminUserAction(id: string) {
  const db = await getDb();
  await db.deleteUserById(id);
  revalidatePath("/admin/users");
  return { success: true, message: "User deleted successfully." };
}
