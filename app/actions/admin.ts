"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/database";
import { GetUsersParams } from "@/lib/types";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export async function getAdminAnalyticsAction(tenantId?: string) {
  const db = await getDb();
  return db.getAdminAnalytics(tenantId);
}

export async function getUsersAction(params: GetUsersParams) {
  const db = await getDb();
  return db.getPaginatedUsers(params);
}

export async function createAdminUserAction(data: {
  fullName: string;
  email: string;
  password?: string;
  role?: string; // Kept for backwards compatibility with UI
}) {
  const db = await getDb();
  const existingUser = await db.findUserByEmail(data.email);
  if (existingUser)
    return { success: false, message: "User with this email already exists." };

  const password = data.password || Math.random().toString(36).slice(-12);
  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = {
    id: uuidv4(),
    fullName: data.fullName,
    email: data.email.toLowerCase(),
    passwordHash,
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
  data: { fullName: string; role?: string }
) {
  const db = await getDb();
  // We only update fullName globally. If UI sends role, we ignore it here because roles are tenant-scoped now.
  const updateData = {
    fullName: data.fullName
  };
  await db.updateUser(id, updateData);
  revalidatePath("/admin/users");
  return { success: true, message: "User updated successfully." };
}

export async function deleteAdminUserAction(id: string) {
  const db = await getDb();
  await db.deleteUserById(id);
  revalidatePath("/admin/users");
  return { success: true, message: "User deleted successfully." };
}
