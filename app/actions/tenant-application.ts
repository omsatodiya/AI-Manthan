"use server";

import { getCurrentUserAction } from "./auth";
import { tenantApplicationFunctions } from "@/lib/functions/tenant-application";
import { CreateTenantApplicationData } from "@/lib/types/tenant-application";
import { revalidatePath } from "next/cache";

export async function submitTenantApplicationAction(data: CreateTenantApplicationData) {
  try {
    const user = await getCurrentUserAction();
    if (!user) {
      return { success: false, error: "You must be logged in to apply." };
    }

    // Check for duplicate pending application for the same slug
    const applications = await tenantApplicationFunctions.getMyTenantApplications(user.id);
    const existingPending = applications.find(
      (app) => app.requestedSlug === data.requestedSlug && app.status === "pending"
    );

    if (existingPending) {
      return { success: false, error: "A pending application for this slug already exists." };
    }

    const application = await tenantApplicationFunctions.createTenantApplication(user.id, data);

    if (!application) {
      return { success: false, error: "Failed to create application. Please try again." };
    }

    revalidatePath("/apply-community");
    revalidatePath("/community-applications");
    return { success: true, application };
  } catch (error) {
    console.error("submitTenantApplicationAction error:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function getMyApplicationsAction() {
  try {
    const user = await getCurrentUserAction();
    if (!user) {
      return { success: false, error: "You must be logged in." };
    }

    const applications = await tenantApplicationFunctions.getMyTenantApplications(user.id);
    return { success: true, applications };
  } catch (error) {
    console.error("getMyApplicationsAction error:", error);
    return { success: false, error: "Failed to fetch applications." };
  }
}

export async function reviewTenantApplicationAction(id: string, status: "approved" | "rejected", note?: string) {
  try {
    const user = await getCurrentUserAction(); // Should ideally be requireSuperAdmin but it redirects, so we check email here or use the helper if possible
    // For now, simpler check
    if (!user || user.email !== "omsatodiya96@gmail.com") {
      return { success: false, error: "Unauthorized." };
    }

    const application = await tenantApplicationFunctions.updateTenantApplication(
      id, 
      { status, rejectionNote: note }, 
      user.id
    );

    if (!application) {
      return { success: false, error: "Failed to update application." };
    }

    revalidatePath("/tenant-applications");
    revalidatePath("/community-applications");
    return { success: true, application };
  } catch (error) {
    console.error("reviewTenantApplicationAction error:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function deleteTenantApplicationAction(id: string) {
  try {
    const user = await getCurrentUserAction();
    if (!user || user.email !== "omsatodiya96@gmail.com") {
      return { success: false, error: "Unauthorized." };
    }

    const success = await tenantApplicationFunctions.deleteTenantApplication(id);
    if (!success) {
      return { success: false, error: "Failed to delete application." };
    }

    revalidatePath("/tenant-applications");
    revalidatePath("/community-applications");
    return { success: true };
  } catch (error) {
    console.error("deleteTenantApplicationAction error:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function updateTenantApplicationDetailsAction(
  id: string, 
  data: { orgName?: string; requestedSlug?: string; description?: string }
) {
  try {
    const user = await getCurrentUserAction();
    if (!user || user.email !== "omsatodiya96@gmail.com") {
      return { success: false, error: "Unauthorized." };
    }

    const application = await tenantApplicationFunctions.updateTenantApplicationDetails(id, data);
    if (!application) {
      return { success: false, error: "Failed to update application details." };
    }

    revalidatePath("/tenant-applications");
    revalidatePath("/community-applications");
    return { success: true, application };
  } catch (error) {
    console.error("updateTenantApplicationDetailsAction error:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}
