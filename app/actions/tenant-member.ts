"use server";

import { getCurrentUserAction } from "./auth";
import { tenantFunctions } from "@/lib/functions/tenant";
import { Tenant, MemberStatus, TenantRole } from "@/lib/types/tenant";
import { revalidatePath } from "next/cache";

/**
 * Fetches all communities where the current user is an owner or admin.
 */
export async function getManagedTenantsAction() {
  try {
    const user = await getCurrentUserAction();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const memberships = await tenantFunctions.getManagedTenants(user.id);
    
    // Extract the tenant objects
    const managedTenants = memberships
      .map(m => m.tenant)
      .filter((t): t is Tenant => !!t);

    return { success: true, tenants: managedTenants };
  } catch (error) {
    console.error("getManagedTenantsAction error:", error);
    return { success: false, error: "Failed to fetch managed communities" };
  }
}

/**
 * Fetches pending join requests for a specific tenant.
 * Validates that the requester has management permissions for that tenant.
 */
export async function getPendingJoinRequestsAction(tenantId: string) {
  try {
    const user = await getCurrentUserAction();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify management permission
    const memberships = await tenantFunctions.getTenantMembersByUser(user.id);
    const isManager = memberships.some(
      m => m.tenantId === tenantId && (m.role === "owner" || m.role === "admin") && m.status === "active"
    );

    if (!isManager) {
      return { success: false, error: "Insufficient permissions" };
    }

    const pendingMembers = await tenantFunctions.getTenantMembers(tenantId, "pending");
    return { success: true, requests: pendingMembers };
  } catch (error) {
    console.error("getPendingJoinRequestsAction error:", error);
    return { success: false, error: "Failed to fetch pending requests" };
  }
}

/**
 * Updates a membership request (e.g., accepting with a role or rejecting).
 */
export async function updateJoinRequestAction(
  memberId: string, 
  status: MemberStatus, 
  role: TenantRole
) {
  try {
    const user = await getCurrentUserAction();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify the member exists and the current user manages that tenant
    const member = await tenantFunctions.findTenantMemberById(memberId);
    if (!member) {
      return { success: false, error: "Member request not found" };
    }

    const memberships = await tenantFunctions.getTenantMembersByUser(user.id);
    const isManager = memberships.some(
      m => m.tenantId === member.tenantId && (m.role === "owner" || m.role === "admin") && m.status === "active"
    );

    if (!isManager) {
      return { success: false, error: "Insufficient permissions" };
    }
    
    const result = await tenantFunctions.updateTenantMember(memberId, { status, role });

    if (!result) {
      return { success: false, error: "Failed to update request" };
    }

    revalidatePath("/community-management");
    return { success: true, member: result };
  } catch (error) {
    console.error("updateJoinRequestAction error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Deletes a membership record (e.g., permanent removal of a request).
 */
export async function deleteJoinRequestAction(memberId: string) {
  try {
    const user = await getCurrentUserAction();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify authorization
    const member = await tenantFunctions.findTenantMemberById(memberId);
    if (!member) {
      return { success: false, error: "Member request not found" };
    }

    const memberships = await tenantFunctions.getTenantMembersByUser(user.id);
    const isManager = memberships.some(
      m => m.tenantId === member.tenantId && (m.role === "owner" || m.role === "admin") && m.status === "active"
    );

    if (!isManager) {
      return { success: false, error: "Insufficient permissions" };
    }

    const success = await tenantFunctions.removeTenantMember(memberId);
    if (!success) {
      return { success: false, error: "Failed to delete request" };
    }

    revalidatePath("/community-management");
    return { success: true };
  } catch (error) {
    console.error("deleteJoinRequestAction error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
