"use server";

import { getDb } from "@/lib/database";
import { getCurrentUserAction } from "./auth";

export async function createAnnouncementOpportunityAction(
  title: string,
  description: string,
  link: string,
  responses: Record<string, unknown>
) {
  try {
    const user = await getCurrentUserAction();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!user.tenantId) {
      return { success: false, error: "No tenant selected" };
    }

    const db = await getDb();
    const opportunity = await db.createAnnouncementOpportunity({
      title,
      description,
      link,
      tenantId: user.tenantId,
      userId: user.id,
      response: responses,
    });

    if (!opportunity) {
      return { success: false, error: "Failed to create opportunity application" };
    }

    return { success: true, data: opportunity };
  } catch (error) {
    console.error("Error creating announcement opportunity:", error);
    return { success: false, error: "Internal server error" };
  }
}

export async function getUserAnnouncementOpportunityAction(announcementId: string) {
  try {
    const user = await getCurrentUserAction();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!user.tenantId) {
      return { success: false, error: "No tenant selected" };
    }

    const db = await getDb();
    const opportunities = await db.getUserAnnouncementOpportunities(user.id, user.tenantId);
    
    // Find the specific opportunity by announcementId (which is now the title)
    const opportunity = opportunities.find(opp => opp.id === announcementId);

    return { success: true, data: opportunity || null };
  } catch (error) {
    console.error("Error fetching user announcement opportunity:", error);
    return { success: false, error: "Internal server error" };
  }
}

export async function getAnnouncementOpportunitiesAction(announcementId: string) {
  try {
    const user = await getCurrentUserAction();
    if (!user || user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    const db = await getDb();
    const opportunities = await db.getAnnouncementOpportunities(announcementId);

    return { success: true, data: opportunities };
  } catch (error) {
    console.error("Error fetching announcement opportunities:", error);
    return { success: false, error: "Internal server error" };
  }
}

export async function deleteAnnouncementOpportunityAction(id: string) {
  try {
    const user = await getCurrentUserAction();
    if (!user || user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    const db = await getDb();
    const success = await db.deleteAnnouncementOpportunity(id, user.tenantId!);

    if (!success) {
      return { success: false, error: "Failed to delete opportunity application" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting announcement opportunity:", error);
    return { success: false, error: "Internal server error" };
  }
}
