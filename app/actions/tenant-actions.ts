"use server";

import { tenantFunctions } from "@/lib/functions/tenant";
import { getCurrentUserAction } from "./auth";
import { revalidatePath } from "next/cache";

export async function getAllPublicCommunitiesAction() {
  try {
    const communities = await tenantFunctions.getPublicTenants();
    return { success: true, communities };
  } catch (error) {
    console.error("getAllPublicCommunitiesAction error:", error);
    return { success: false, error: "Failed to fetch communities." };
  }
}

export async function requestToJoinCommunityAction(tenantId: string) {
  try {
    const user = await getCurrentUserAction();
    if (!user) {
      return { success: false, error: "You must be logged in to join a community." };
    }

    // Check if user is already a member (any status)
    const memberships = await tenantFunctions.getTenantMembersByUser(user.id);
    const existing = memberships.find(m => m.tenantId === tenantId);
    
    if (existing) {
      if (existing.status === "pending") {
        return { success: false, error: "Your request is already pending approval." };
      }
      if (existing.status === "active") {
        return { success: false, error: "You are already a member of this community." };
      }
      if (existing.status === "rejected") {
        return { success: false, error: "Your previous request was declined. Please contact the admin." };
      }
    }

    const member = await tenantFunctions.addTenantMember({
      userId: user.id,
      tenantId,
      role: "member",
      status: "pending",
      permissions: [],
    });

    if (!member) {
      return { success: false, error: "Failed to create join request." };
    }

    revalidatePath("/join-community");
    revalidatePath("/community-management");
    return { success: true, member };
  } catch (error) {
    console.error("requestToJoinCommunityAction error:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function getMyMembershipsAction() {
  try {
    const user = await getCurrentUserAction();
    if (!user) return { success: false, error: "Unauthorized" };

    const memberships = await tenantFunctions.getTenantMembersByUser(user.id);
    return { success: true, memberships };
  } catch (error) {
    console.error("getMyMembershipsAction error:", error);
    return { success: false, error: "Failed to fetch memberships." };
  }
}
