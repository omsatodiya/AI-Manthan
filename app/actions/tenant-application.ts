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
