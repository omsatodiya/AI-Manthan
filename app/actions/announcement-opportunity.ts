"use server";

import { getDb } from "@/lib/database";
import { getCurrentUserAction } from "./auth";
import { revalidatePath } from "next/cache";
import { CreateAnnouncementOpportunityData } from "@/lib/types";

export async function createAnnouncementOpportunityAction(
  tenantId: string,
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

    if (!tenantId) {
      return { success: false, error: "No tenant selected" };
    }

    const db = await getDb();
    const opportunity = await db.createAnnouncementOpportunity({
      title,
      description,
      link,
      tenantId,
      userId: user.id,
      response: responses,
    });

    if (!opportunity) {
      return { success: false, error: "Failed to create opportunity application" };
    }

    revalidatePath("/admin/announcements");
    revalidatePath("/announcements");
    revalidatePath("/community-management/announcements");

    return { success: true, data: opportunity };
  } catch (error) {
    console.error("Error creating announcement opportunity:", error);
    return { success: false, error: "Internal server error" };
  }
}

export async function getUserAnnouncementOpportunityAction(tenantId: string, announcementId: string) {
  try {
    const user = await getCurrentUserAction();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!tenantId) {
      return { success: false, error: "No tenant selected" };
    }

    const db = await getDb();
    const opportunities = await db.getUserAnnouncementOpportunities(user.id, tenantId);
    
    const opportunity = opportunities.find(opp => opp.id === announcementId);

    return { success: true, data: opportunity || null };
  } catch (error) {
    console.error("Error fetching user announcement opportunity:", error);
    return { success: false, error: "Internal server error" };
  }
}

export async function getAnnouncementOpportunitiesAction(tenantId: string, announcementId: string) {
  try {
    const user = await getCurrentUserAction();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!tenantId) {
      return { success: false, error: "No tenant selected" };
    }

    const db = await getDb();
    const opportunities = await db.getAnnouncementOpportunities(announcementId);

    return { success: true, data: opportunities };
  } catch (error) {
    console.error("Error fetching announcement opportunities:", error);
    return { success: false, error: "Internal server error" };
  }
}

export async function deleteAnnouncementOpportunityAction(tenantId: string, id: string) {
  try {
    const user = await getCurrentUserAction();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!tenantId) {
      return { success: false, error: "No tenant selected" };
    }

    const db = await getDb();
    const success = await db.deleteAnnouncementOpportunity(id, tenantId);

    if (!success) {
      return { success: false, error: "Failed to delete opportunity application" };
    }

    revalidatePath("/admin/announcements");
    revalidatePath("/announcements");
    revalidatePath("/community-management/announcements");

    return { success: true };
  } catch (error) {
    console.error("Error deleting announcement opportunity:", error);
    return { success: false, error: "Internal server error" };
  }
}

export async function updateAnnouncementOpportunityAction(
  tenantId: string,
  id: string,
  data: Partial<CreateAnnouncementOpportunityData>
) {
  try {
    const user = await getCurrentUserAction();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!tenantId) {
      return { success: false, error: "No tenant selected" };
    }

    const db = await getDb();
    const updated = await db.updateAnnouncementOpportunity(id, data, tenantId);

    if (!updated) {
      return { success: false, error: "Failed to update opportunity announcement" };
    }

    revalidatePath("/admin/announcements");
    revalidatePath("/announcements");
    revalidatePath("/community-management/announcements");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating announcement opportunity:", error);
    return { success: false, error: "Internal server error" };
  }
}
