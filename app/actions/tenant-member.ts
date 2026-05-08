"use server";

import { getCurrentUserAction } from "./auth";
import { tenantFunctions } from "@/lib/functions/tenant";
import { userFunctions } from "@/lib/functions/user";
import { Tenant, MemberStatus, TenantRole } from "@/lib/types/tenant";
import { revalidatePath } from "next/cache";

/**
 * Fetches all communities where the current user is an owner or admin.
 */
export async function getManagedTenantsAction() {
  try {
    const user = await getCurrentUserAction();
    if (!user) {
      return { success: false as const, error: "Unauthorized" };
    }

    const memberships = await tenantFunctions.getManagedTenants(user.id);
    
    // Extract the tenant objects
    const managedTenants = memberships
      .map(m => m.tenant)
      .filter((t): t is Tenant => !!t);

    return { success: true as const, tenants: managedTenants };
  } catch (error) {
    console.error("getManagedTenantsAction error:", error);
    return { success: false as const, error: "Failed to fetch managed communities" };
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
      return { success: false as const, error: "Unauthorized" };
    }

    // Verify management permission
    const memberships = await tenantFunctions.getTenantMembersByUser(user.id);
    const isManager = memberships.some(
      m => m.tenantId === tenantId && (m.role === "owner" || m.role === "admin") && m.status === "active"
    );

    if (!isManager) {
      return { success: false as const, error: "Insufficient permissions" };
    }

    const pendingMembers = await tenantFunctions.getTenantMembers(tenantId, "pending");
    return { success: true as const, requests: pendingMembers };
  } catch (error) {
    console.error("getPendingJoinRequestsAction error:", error);
    return { success: false as const, error: "Failed to fetch pending requests" };
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
      return { success: false as const, error: "Unauthorized" };
    }

    // Verify the member exists and the current user manages that tenant
    const member = await tenantFunctions.findTenantMemberById(memberId);
    if (!member) {
      return { success: false as const, error: "Member request not found" };
    }

    const memberships = await tenantFunctions.getTenantMembersByUser(user.id);
    const isManager = memberships.some(
      m => m.tenantId === member.tenantId && (m.role === "owner" || m.role === "admin") && m.status === "active"
    );

    if (!isManager) {
      return { success: false as const, error: "Insufficient permissions" };
    }
    
    const result = await tenantFunctions.updateTenantMember(memberId, { status, role });

    if (!result) {
      return { success: false as const, error: "Failed to update request" };
    }

    revalidatePath("/community-management");
    return { success: true as const, member: result };
  } catch (error) {
    console.error("updateJoinRequestAction error:", error);
    return { success: false as const, error: "An unexpected error occurred" };
  }
}

/**
 * Deletes a membership record (e.g., permanent removal of a request).
 */
export async function deleteJoinRequestAction(memberId: string) {
  try {
    const user = await getCurrentUserAction();
    if (!user) {
      return { success: false as const, error: "Unauthorized" };
    }

    // Verify authorization
    const member = await tenantFunctions.findTenantMemberById(memberId);
    if (!member) {
      return { success: false as const, error: "Member request not found" };
    }

    const memberships = await tenantFunctions.getTenantMembersByUser(user.id);
    const isManager = memberships.some(
      m => m.tenantId === member.tenantId && (m.role === "owner" || m.role === "admin") && m.status === "active"
    );

    if (!isManager) {
      return { success: false as const, error: "Insufficient permissions" };
    }

    const success = await tenantFunctions.removeTenantMember(memberId);
    if (!success) {
      return { success: false as const, error: "Failed to delete request" };
    }

    revalidatePath("/community-management");
    return { success: true as const };
  } catch (error) {
    console.error("deleteJoinRequestAction error:", error);
    return { success: false as const, error: "An unexpected error occurred" };
  }
}

/**
 * Fetches members of a tenant with pagination, filtering, and sorting.
 */
export async function getTenantMembersPaginatedAction(params: {
  tenantId: string;
  pageIndex: number;
  pageSize: number;
  query?: string;
  sort?: { id: string; desc: boolean };
}) {
  try {
    const user = await getCurrentUserAction();
    if (!user) return { success: false as const, error: "Unauthorized" };

    // Verify management permission
    const memberships = await tenantFunctions.getTenantMembersByUser(user.id);
    const isManager = memberships.some(
      m => m.tenantId === params.tenantId && (m.role === "owner" || m.role === "admin") && m.status === "active"
    );

    if (!isManager) {
      return { success: false as const, error: "Insufficient permissions" };
    }

    const result = await tenantFunctions.getPaginatedTenantMembers(params);
    return { success: true as const, ...result };
  } catch (error) {
    console.error("getTenantMembersPaginatedAction error:", error);
    return { success: false as const, error: "Failed to fetch members" };
  }
}

/**
 * Removes a member from a tenant.
 */
export async function removeMemberFromTenantAction(memberId: string) {
  try {
    const user = await getCurrentUserAction();
    if (!user) return { success: false as const, error: "Unauthorized" };

    const member = await tenantFunctions.findTenantMemberById(memberId);
    if (!member) return { success: false as const, error: "Member not found" };

    // Verify management permission for this tenant
    const memberships = await tenantFunctions.getTenantMembersByUser(user.id);
    const isManager = memberships.some(
      m => m.tenantId === member.tenantId && (m.role === "owner" || m.role === "admin") && m.status === "active"
    );

    if (!isManager) {
      return { success: false as const, error: "Insufficient permissions" };
    }

    // Prevent removing yourself if you are the only owner (business logic check could be added here)

    const success = await tenantFunctions.removeTenantMember(memberId);
    if (!success) return { success: false as const, error: "Failed to remove member" };

    revalidatePath("/community-management");
    return { success: true as const };
  } catch (error) {
    console.error("removeMemberFromTenantAction error:", error);
    return { success: false as const, error: "An unexpected error occurred" };
  }
}

/**
 * Fetches analytics for a specific community.
 */
export async function getCommunityAnalyticsAction(tenantId: string) {
  try {
    const user = await getCurrentUserAction();
    if (!user) return { success: false as const, error: "Unauthorized" };

    const { totalUsers, totalAdmins } = await userFunctions.getAdminAnalytics(tenantId);
    
    // Also get pending requests count
    const { count: pendingRequests } = await (await import("@/lib/database/clients")).getSupabaseClient().then(supabase => 
      supabase.from("tenant_members").select("id", { count: "exact" }).eq("tenant_id", tenantId).eq("status", "pending").range(0, 0)
    );

    return { 
      success: true as const, 
      stats: {
        totalMembers: totalUsers,
        activeAdmins: totalAdmins,
        pendingRequests: pendingRequests || 0
      }
    };
  } catch (error) {
    console.error("getCommunityAnalyticsAction error:", error);
    return { success: false as const, error: "Failed to fetch analytics" };
  }
}

/**
 * Fetches all join requests and memberships for the current user.
 */
export async function getMyJoinRequestsAction() {
  try {
    const user = await getCurrentUserAction();
    if (!user) {
      return { success: false as const, error: "Unauthorized" };
    }

    const requests = await tenantFunctions.getTenantMembersByUser(user.id);
    
    // Sort by joinedAt desc
    const sortedRequests = [...requests].sort((a, b) => 
      new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
    );

    return { success: true as const, requests: sortedRequests };
  } catch (error) {
    console.error("getMyJoinRequestsAction error:", error);
    return { success: false as const, error: "Failed to fetch your community applications" };
  }
}
