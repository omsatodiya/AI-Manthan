"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/database";
import { getCurrentUserAction, logoutAction } from "./auth";
import { getSupabaseClient } from "@/lib/database/clients";

export async function updateUserNameAction(newName: string) {
  const db = await getDb();
  const user = await getCurrentUserAction();

  if (!user) {
    throw new Error("You must be logged in to update your profile.");
  }

  try {
    await db.updateUser(user.id, { fullName: newName });
    revalidatePath("/user");
    return { success: true, message: "Name updated successfully." };
  } catch (error) {
    console.error("Error updating user name:", error);
    return { success: false, message: "Failed to update name." };
  }
}

export async function deleteUserAction() {
  const db = await getDb();
  const user = await getCurrentUserAction();

  if (!user) {
    throw new Error("You must be logged in to delete your account.");
  }

  try {
    const deleted = await db.deleteUserById(user.id);
    if (!deleted) {
      throw new Error("Database deletion failed.");
    }
    await logoutAction();
    return { success: true, message: "Account deleted successfully." };
  } catch (error) {
    console.error("Error deleting user account:", error);
    return { success: false, message: "Failed to delete account." };
  }
}

export async function getTenantMembersAction() {
  try {
    const currentUser = await getCurrentUserAction();

    if (!currentUser) {
      return { success: false, error: "No user found - please log in first" };
    }

    const supabase = await getSupabaseClient();

    const { data: members, error: membersError } = await supabase
      .from("tenant_members")
      .select(
        `
        id,
        user_id,
        tenant_id,
        role,
        created_at,
        tenants (
          id,
          name,
          slug,
          created_at
        )
      `
      )
      .eq("user_id", currentUser.id);

    if (membersError) {
      console.error("Error fetching tenant members:", membersError);
      return {
        success: false,
        error: `Error fetching tenant members: ${membersError.message}`,
      };
    }

    return {
      success: true,
      user: currentUser,
      tenantMembers: members || [],
    };
  } catch (err) {
    console.error("Unexpected error:", err);
    return {
      success: false,
      error: `Unexpected error: ${
        err instanceof Error ? err.message : "Unknown error"
      }`,
    };
  }
}
